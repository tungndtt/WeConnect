import sqlite3
import os
from datetime import datetime
from typing import Optional, Any


class Database:
    def __init__(self) -> None:
        print("[Database]: Initializing database")
        DATABASE_PATH = os.environ.get("DATABASE_PATH", "/database.db")
        self.__connection = sqlite3.connect(DATABASE_PATH)
        self.__cursor = self.__connection.cursor()
        try:
            self.__cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    email TEXT NOT NULL,
                    password TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                )
                '''
            )
            self.__cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS chat_groups (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    owner_id INTEGER NOT NULL,
                )
                '''
            )
            self.__cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id INTEGER PRIMARY KEY,
                    user_1 INTEGER NOT NULL,
                    user_2 INTEGER NOT NULL,
                    last_message_timestamp TIMESTAMP,
                )
                '''
            )
            self.__connection.commit()
        except Exception as error:
            print("[Database]: Cannot setup the database tables: " + error)
            self.__connection.rollback()
            quit()

    def close(self) -> None:
        self.__cursor.close()
        self.__connection.close()
    
    def check_user_existence(self, email: str) -> bool:
        self.__cursor("SELECT * FROM users WHERE email = ?", (email))
        return self.__cursor.fetchone() is not None
    
    def get_user(self, email: str, password: str) -> int:
        self.__cursor.execute("SELECT id FROM users WHERE email = ? AND password = ?", (email, password))
        user = self.__cursor.fetchone()
        if user is not None:
            return user[0]
        else:
            return -1
    
    def get_all_users(self) -> list[Any]:
        self.__cursor.execute("SELECT id, first_name, last_name FROM users")
        return self.__cursor.fetchall()

    def get_users_information(self, users_id: list[int], is_private: bool) -> list[Any]:
        fields = "id, first_name, last_name" + (", email, password" if is_private else "")
        in_array = ",".join(["?" for _ in range(len(users_id))])
        self.__cursor.execute(f"SELECT {fields} FROM users WHERE id IN ({in_array})", users_id)
        return self.__cursor.fetchall()

    def get_chat_groups(self) -> list[int]:
        self.__cursor.execute("SELECT id FROM chat_groups")
        return self.__cursor.fetchall()
    
    def get_chat_rooms(self, user_id: int) -> list[Any]:
        self.__cursor.execute("SELECT id FROM chat_rooms WHERE user_1 = ? OR user_2 = ?", (user_id, user_id))
        return self.__cursor.fetchall()

    def __get_chat_messages(self, table_name: str, timestamp: str, before: bool, result_limit: int) -> list[Any]:
        compare_op = "<=" if before else ">="
        self.__cursor.execute(
            f"SELECT * FROM {table_name} WHERE timestamp {compare_op} ? ORDER BY timestamp DESC", timestamp
        )
        return self.__cursor.fetchmany(result_limit)

    def get_human_chat_messages(self, is_room: bool, chat_id: int, timestamp: str, before: bool, result_limit: int) -> list[Any]:
        chat_type = "room" if is_room else "group"
        return self.__get_chat_messages(f"chat_{chat_type}_{chat_id}", timestamp, before, result_limit)
    
    def get_bot_chat_messages(self, user_id: int, timestamp: str, before: bool, result_limit: int) -> list[Any]:
        return self.__get_chat_messages(f"user_{user_id}_bot_chat", timestamp, before, result_limit)
    
    def get_notifications(self, user_id: int) -> list[Any]:
        self.__cursor.execute(f"SELECT * FROM user_{user_id}_notifications")
        return self.__cursor.fetchall()

    def register_new_user(self, email: str, password: str, first_name: str, last_name: str) -> int:
        try:
            self.__cursor.execute(
                "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)", 
                (email, password, first_name, last_name)
            )
            self.__connection.commit()
            user_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f'''
                CREATE TABLE user_{user_id}_notifications (
                    id INTEGER PRIMARY KEY,
                    sender_id INTEGER NOT NULL,
                    chat_room_id INTEGER NOT NULL,
                    is_read BOOLEAN NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                '''
            )
            self.__cursor.execute(
                f'''
                CREATE TABLE user_{user_id}_bot_chat (
                    id INTEGER PRIMARY KEY,
                    is_user BOOLEAN NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                '''
            )
            self.__connection.commit()
            return user_id
        except Exception as error:
            print("[Database]: Cannot register new user: " + error)
            self.__connection.rollback()
            return False
    
    def register_new_chat_room(self, sender_id: int, receiver_id: int) -> Optional[int]:
        try:
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            self.__cursor.execute(
                "INSERT INTO chat_rooms (user_1, user_2, last_message_timestamp) VALUES (?, ?, ?)", 
                (sender_id, receiver_id, current_timestamp)
            )
            self.__connection.commit()
            chat_room_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f'''
                CREATE TABLE chat_room_{chat_room_id} (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                '''
            )
            self.__connection.commit()
            return chat_room_id
        except Exception as error:
            print("[Database]: Cannot register new chat room: " + error)
            self.__connection.rollback()
            return None

    def register_new_chat_group(self, chat_group_name: str, creator_id: int) -> bool:
        try:
            self.__cursor.execute(
                "INSERT INTO chat_groups (name, owner_id) VALUES (?)", (chat_group_name, creator_id)
            )
            self.__connection.commit()
            chat_group_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f'''
                CREATE TABLE chat_group_{chat_group_id} (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                '''
            )
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot register new chat group: " + error)
            self.__connection.rollback()
            return False
    
    def register_new_message_with_bot(self, user_id: int, is_user: bool, message: str) -> str:
        try:
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            self.__cursor.execute(
                f"INSERT INTO user_{user_id}_bot_chat (is_user, message, timestamp) VALUES (?, ?)", 
                (is_user, message, current_timestamp)
            )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot register new message in bot chat: " + error)
            self.__connection.rollback()
            return ""
    
    def register_new_message_in_group(self, sender_id: int, chat_group_id: int, message: str) -> str:
        try:
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            self.__cursor.execute(
                f"INSERT INTO chat_group_{chat_group_id} (user_id, message, timestamp) VALUES (?, ?)", 
                (sender_id, message, current_timestamp)
            )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot register new message in group chat: " + error)
            self.__connection.rollback()
            return ""

    def register_new_message_in_room(self, sender_id: int, receiver_id: int, chat_room_id: int, message: str) -> str:
        try:
            # register the message
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            self.__cursor.execute(
                f"INSERT INTO chat_room_{chat_room_id} (user_id, message, timestamp) VALUES (?, ?)", 
                (sender_id, message, current_timestamp)
            )
            self.__cursor.execute(
                f"UPDATE chat_rooms SET last_message_timestamp = ? WHERE chat_room_id = ?",
                (current_timestamp, chat_room_id)
            )
            # register the notification
            self.__cursor.execute(f"SELECT id FROM user_{receiver_id}_notifications WHERE chat_room_id = ?", (chat_room_id))
            if self.__cursor.fetchone() is None:
                self.__cursor.execute(
                    f"INSERT INTO user_{receiver_id}_notifications (sender_id, chat_room_id, is_read, timestamp) VALUES (?, ?)", 
                    (sender_id, chat_room_id, False, current_timestamp)
                )
            else:
                self.__cursor.execute(
                    f"UPDATE user_{receiver_id}_notifications SET is_read = ? AND timestamp = ? WHERE chat_room_id = ?", 
                    (False, current_timestamp, chat_room_id)
                )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot register new message in chat room: " + error)
            self.__connection.rollback()
            return ""

    def update_user_information(
        self, user_id: int, first_name: Optional[str], last_name: Optional[str], password: Optional[str]
    ) -> bool:
        try:
            query = "UPDATE users SET"
            values = []
            if first_name is not None:
                query += " first_name = ?,"
                values.append(first_name)
            if last_name is not None:
                query += " last_name = ?,"
                values.append(last_name)
            if password is not None:
                query += " password = ?,"
                values.append(password)
            query = query.rstrip(",")
            query += "WHERE user_id = ?"
            values.append(user_id)
            self.__cursor.execute(query, values)
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot update user information: " + error)
            self.__connection.rollback()
            return False

    def update_chat_group_name(self, chat_group_id: int, name: str) -> bool:
        try:
            self.__cursor.execute(
                f"UPDATE chat_groups SET name = ? WHERE id = ?", 
                (name, chat_group_id)
            )
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot update notification status: " + error)
            self.__connection.rollback()
            return False

    def update_read_notification(self, user_id: int, chat_room_id: int) -> bool:
        try:
            self.__cursor.execute(
                f"UPDATE user_{user_id}_notifications SET is_read = ? WHERE chat_room_id = ?", 
                (True, chat_room_id)
            )
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot update notification status: " + error)
            self.__connection.rollback()
            return False
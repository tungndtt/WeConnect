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
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    password TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                )
                """
            )
            self.__cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    owner_id INTEGER NOT NULL,
                )
                """
            )
            self.__cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_1 INTEGER NOT NULL,
                    user_2 INTEGER NOT NULL,
                )
                """
            )
            self.__connection.commit()
        except Exception as error:
            print("[Database]: Cannot setup the database tables: " + error)
            self.__connection.rollback()
            self.__close()
            quit()

    def __close(self) -> None:
        self.__cursor.close()
        self.__connection.close()
    
    def check_user_existence(self, email: str) -> bool:
        self.__cursor("SELECT * FROM users WHERE email = ?", (email))
        return self.__cursor.fetchone() is not None
    
    def get_user_id(self, email: str, password: str) -> Optional[int]:
        self.__cursor.execute(
            "SELECT id FROM users WHERE email = ? AND password = ?", 
            (email, password)
        )
        user = self.__cursor.fetchone()
        if user is not None:
            return user[0]
        else:
            return None
    
    def get_all_users(self) -> list[Any]:
        self.__cursor.execute("SELECT id, first_name, last_name FROM users")
        return self.__cursor.fetchall()
    
    def get_user_profile(self, user_id: int) -> Optional[Any]:
        self.__cursor.execute("SELECT * FROM users WHERE id = ?", (user_id))
        return self.__cursor.fetchone()

    def get_group_member_ids(self, chat_group_id: int) -> list[int]:
        self.__cursor.execute(
            f"""
            SELECT user_id
            FROM chat_group_{chat_group_id}_requests
            WHERE access = ?
            """,
            (True)
        )
        return [row[0] for row in self.__cursor.fetchall()]

    def get_group_access_requests(self, chat_group_id: int) -> list[Any]:
        self.__cursor.execute(
            f"SELECT * FROM chat_group_{chat_group_id}_access_requests"
        )
        return self.__cursor.fetchall()

    def get_chat_groups(self) -> list[Any]:
        self.__cursor.execute("SELECT * FROM chat_groups")
        return self.__cursor.fetchall()
    
    def get_chat_rooms(self, user_id: int) -> list[int]:
        self.__cursor.execute(
            """
            SELECT id
            FROM chat_rooms
            WHERE user_1 = ? OR user_2 = ?
            """, 
            (user_id, user_id)
        )
        return [row[0] for row in self.__cursor.fetchall()]

    def __get_chat_messages(
        self, 
        table_name: str, 
        timestamp: str, 
        before: bool, 
        result_limit: int
    ) -> list[Any]:
        compare_op = "<=" if before else ">="
        self.__cursor.execute(
            f"""
            SELECT * FROM {table_name} 
            WHERE timestamp {compare_op} ? 
            ORDER BY timestamp DESC
            """, 
            timestamp
        )
        return self.__cursor.fetchmany(result_limit)

    def get_human_chat_messages(
        self, 
        is_room: bool, 
        chat_id: int, 
        timestamp: str, 
        before: bool, 
        result_limit: int
    ) -> list[Any]:
        chat_type = "room" if is_room else "group"
        return self.__get_chat_messages(
            f"chat_{chat_type}_{chat_id}", timestamp, before, result_limit
        )
    
    def get_bot_chat_messages(
        self, 
        user_id: int, 
        timestamp: str, 
        before: bool, 
        result_limit: int
    ) -> list[Any]:
        return self.__get_chat_messages(
            f"user_{user_id}_bot_chat", timestamp, before, result_limit
        )
    
    def get_chat_notifications(self, user_id: int) -> list[Any]:
        self.__cursor.execute(
            f"SELECT * FROM user_{user_id}_chat_notifications"
        )
        return self.__cursor.fetchall()
    
    def get_user_access_requests(self, user_id: int) -> list[Any]:
        self.__cursor.execute(
            f"SELECT * FROM user_{user_id}_access_requests"
        )
        return self.__cursor.fetchall()

    def register_new_user(
        self, 
        email: str, 
        password: str, 
        first_name: str, 
        last_name: str
    ) -> Optional[int]:
        try:
            self.__cursor.execute(
                """
                INSERT INTO users
                (email, password, first_name, last_name)
                VALUES (?, ?, ?, ?)
                """, 
                (email, password, first_name, last_name)
            )
            self.__connection.commit()
            user_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f"""
                CREATE TABLE user_{user_id}_chat_notifications (
                    user_id INTEGER NOT NULL,
                    chat_id INTEGER NOT NULL,
                    is_room BOOLEAN NOT NULL,
                    is_read BOOLEAN NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    PRIMARY KEY (chat_id, is_room)
                )
                """
            )
            self.__cursor.execute(
                f"""
                CREATE TABLE user_{user_id}_access_requests (
                    chat_group_id INTEGER PRIMARY KEY,
                    timestamp TIMESTAMP NOT NULL,
                )
                """
            )
            self.__cursor.execute(
                f"""
                CREATE TABLE user_{user_id}_bot_chat (
                    is_user BOOLEAN NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                """
            )
            self.__connection.commit()
            return user_id
        except Exception as error:
            print("[Database]: Cannot register new user: " + error)
            self.__connection.rollback()
            return None
    
    def register_new_chat_room(
        self, 
        sender_id: int, 
        receiver_id: int
    ) -> Optional[int]:
        try:
            self.__cursor.execute(
                """
                INSERT INTO chat_rooms
                (user_1, user_2)
                VALUES (?, ?)
                """, 
                (sender_id, receiver_id)
            )
            self.__connection.commit()
            chat_room_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f"""
                CREATE TABLE chat_room_{chat_room_id} (
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                """
            )
            self.__connection.commit()
            return chat_room_id
        except Exception as error:
            print("[Database]: Cannot register new chat room: " + error)
            self.__connection.rollback()
            return None

    def register_new_chat_group(
        self, 
        chat_group_name: str, 
        creator_id: int
    ) -> Optional[int]:
        try:
            self.__cursor.execute(
                "INSERT INTO chat_groups (name, owner_id) VALUES (?)", 
                (chat_group_name, creator_id)
            )
            self.__connection.commit()
            chat_group_id = self.__cursor.lastrowid
            self.__cursor.execute(
                f"""
                CREATE TABLE chat_group_{chat_group_id} (
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                )
                """
            )
            self.__cursor.execute(
                f"""
                CREATE TABLE chat_group_{chat_group_id}_access_requests (
                    user_id INTEGER PRIMARY KEY,
                    access BOOLEAN NOT NULL,
                )
                """
            )
            self.__cursor.execute(
                f"""
                INSERT INTO chat_group_{chat_group_id}_access_requests
                (user_id, access)
                VALUES (?, ?)
                """,
                (creator_id, True)
            )
            self.__cursor.execute(
                f"""
                INSERT INTO user_{creator_id}_chat_notifications
                (user_id, chat_id, is_room, is_read, timestamp)
                VALUES (?, ?, ?, ?)
                """,
                (
                    creator_id, 
                    chat_group_id, 
                    False, 
                    datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                )
            )
            self.__connection.commit()
            return chat_group_id
        except Exception as error:
            print("[Database]: Cannot register new chat group: " + error)
            self.__connection.rollback()
            return None
    
    def register_new_message_with_bot(
        self, 
        user_id: int, 
        is_user: bool, 
        message: str
    ) -> Optional[str]:
        try:
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            self.__cursor.execute(
                f"""
                INSERT INTO user_{user_id}_bot_chat
                (is_user, message, timestamp)
                VALUES (?, ?, ?)
                """, 
                (is_user, message, current_timestamp)
            )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot register new message in bot chat: " + error)
            self.__connection.rollback()
            return None
    
    def __insert_new_message_with_human(
        self, 
        sender_id: int, 
        chat_id: int, 
        is_room: bool, 
        message: str
    ) -> str:
        try:
            # register the message
            current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            chat_type = "room" if is_room else "group"
            self.__cursor.execute(
                f"""
                INSERT INTO chat_{chat_type}_{chat_id}
                (user_id, message, timestamp)
                VALUES (?, ?, ?)
                """, 
                (sender_id, message, current_timestamp)
            )
            notify_user_ids = []
            if is_room:
                self.__cursor.execute(
                    f"SELECT user_1, user_2 FROM chat_rooms WHERE id = ?", 
                    (sender_id)
                )
                notify_user_ids = [user_id for user_id in self.__cursor.fetchone()]
            else:
                self.__cursor.execute(
                    f"""
                    SELECT user_id
                    FROM chat_group_{chat_id}_access_requests
                    WHERE access = ?
                    """, 
                    (True)
                )
                notify_user_ids = [row[0] for row in self.__cursor.fetchall()]
            # register the notifications
            for notify_user_id in notify_user_ids:
                if notify_user_id != sender_id:
                    self.__cursor.execute(
                        f"""
                        SELECT id
                        FROM user_{notify_user_id}_chat_notifications
                        WHERE chat_id = ?
                        """, 
                        (chat_id)
                    )
                    if self.__cursor.fetchone() is None:
                        self.__cursor.execute(
                            f"""
                            INSERT INTO user_{notify_user_id}_chat_notifications
                            (user_id, chat_id, is_room, is_read, timestamp)
                            VALUES (?, ?, ?, ?)
                            """, 
                            (sender_id, chat_id, is_room, False, current_timestamp)
                        )
                    else:
                        self.__cursor.execute(
                            f"""
                            UPDATE user_{notify_user_id}_chat_notifications
                            SET is_read = ? AND timestamp = ?
                            WHERE chat_id = ? AND is_room = ?
                            """, 
                            (False, current_timestamp, chat_id, is_room)
                        )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot register new message with human: " + error)
            self.__connection.rollback()
            return None


    def register_new_message_in_group(
        self, 
        sender_id: int, 
        chat_group_id: int, 
        message: str
    ) -> Optional[str]:
        return self.__insert_new_message_with_human(
            sender_id, chat_group_id, False, message
        )

    def register_new_message_in_room(
        self, 
        sender_id: int, 
        chat_room_id: int, 
        message: str
    ) -> Optional[str]:
        return self.__insert_new_message_with_human(
            sender_id, chat_room_id, True, message
        )
    
    def register_new_access_request(
        self, 
        requester_id: int, 
        chat_group_id: int
    ) -> bool:
        try:
            # insert group access request on non-existence
            self.__cursor.execute(
                f"""
                INSERT INTO chat_group_{chat_group_id}_access_requests
                (user_id, access)
                VALUES (?, ?)
                """,
                (requester_id, False)
            )
            self.__cursor.execute(
                f"""
                INSERT INTO user_{requester_id}_access_requests
                (chat_group_id, timestamp)
                VALUES (?, ?)
                """,
                (chat_group_id, datetime.now().strftime("%d/%m/%Y %H:%M:%S"))
            )
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot register new access request in chat group: " + error)
            self.__connection.rollback()
            return False
        
    def __update_information(self, **args):
        try:
            query = "UPDATE users SET"
            values = []
            for field, value in args.items():
                if value is not None:
                    query += f" {field} = ?,"
                    values.append(value)
            query = query.rstrip(",")
            query += "WHERE id = ?"
            values.append(args["id"])
            self.__cursor.execute(query, values)
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot update information: " + error)
            self.__connection.rollback()
            return False

    def update_user_profile(
        self, 
        user_id: int, 
        first_name: Optional[str], 
        last_name: Optional[str], 
        password: Optional[str]
    ) -> bool:
        return self.__update_information({
            "first_name": first_name, 
            "last_name": last_name, 
            "password": password, 
            "id": user_id
        })

    def update_chat_group(
        self, 
        chat_group_id: int, 
        group_name: str, 
        owner_id: int
    ) -> bool:
        return self.__update_information({
            "name": group_name, 
            "owner_id": owner_id, 
            "id": chat_group_id
        })

    def update_chat_notification(
        self, 
        user_id: int, 
        chat_id: int, 
        is_room: bool
    ) -> bool:
        try:
            self.__cursor.execute(
                f"""
                UPDATE user_{user_id}_chat_notifications
                SET is_read = ?
                WHERE chat_id = ? AND is_room = ?
                """, 
                (True, chat_id, is_room)
            )
            self.__connection.commit()
            return True
        except Exception as error:
            print("[Database]: Cannot update message notification: " + error)
            self.__connection.rollback()
            return False
    
    def update_access_request(
        self, 
        reviewer_id: int, 
        requester_id: int, 
        chat_group_id: int, 
        access: bool
    ) -> Optional[str]:
        try:
            self.__cursor.execute(
                f"""
                SELECT *
                FROM chat_groups
                WHERE id = ? AND owner_id = ?
                """,
                (chat_group_id, reviewer_id)
            )
            current_timestamp = None
            if self.__cursor.fetchone() is None:
                return current_timestamp
            if access:
                # upsert group access request
                self.__cursor.execute(
                    f"""
                    SELECT *
                    FROM chat_group_{chat_group_id}_access_requests
                    WHERE user_id = ?
                    """,
                    (requester_id)
                )
                if self.__cursor.fetchone() is None:
                    self.__cursor.execute(
                        f"""
                        INSERT INTO chat_group_{chat_group_id}_access_requests
                        (user_id, access)
                        VALUES (?, ?)
                        """,
                        (requester_id, access)
                    )
                else:
                    self.__cursor.execute(
                        f"""
                        UPDATE chat_group_{chat_group_id}_access_requests
                        SET access = ?
                        WHERE user_id = ?
                        """,
                        (access, requester_id)
                    )
                # insert user chat notification
                current_timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                self.__cursor.execute(
                    f"""
                    INSERT INTO user_{requester_id}_chat_notifications
                    (user_id, chat_id, is_room, is_read, timestamp)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        reviewer_id, 
                        chat_group_id, 
                        False, 
                        False, 
                        current_timestamp
                    )
                )
            else:
                self.__cursor.execute(
                    f"""
                    DELETE FROM chat_group_{chat_group_id}_access_requests
                    WHERE user_id = ?
                    """, 
                    (requester_id)
                )
                self.__cursor.execute(
                    f"""
                    DELETE FROM user_{requester_id}_access_requests
                    WHERE chat_group_id = ?
                    """,
                    (chat_group_id)
                )
            self.__connection.commit()
            return current_timestamp
        except Exception as error:
            print("[Database]: Cannot update access notification: " + error)
            self.__connection.rollback()
            return None
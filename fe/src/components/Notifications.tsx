import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Badge,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { AppStateContext } from "../AppStateProvider";
import theme from "./theme";

export default function Notifications() {
  const { notifications, users, chatGroups, getUserNameAbbreviation } =
    useContext(AppStateContext);
  const navigate = useNavigate();
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<null | HTMLElement>(null);
  const getUserName = (userId: number) => {
    const user = users[userId];
    return user.firstName + " " + user.lastName;
  };
  return (
    <Box>
      <Badge
        color="warning"
        badgeContent={
          notifications?.filter((notification) => !notification.isRead).length
        }
      >
        <IconButton
          id="notifications"
          aria-controls={
            notificationsAnchorEl ? "notifications-list" : undefined
          }
          aria-haspopup="true"
          aria-expanded={notificationsAnchorEl ? "true" : undefined}
          onClick={(e) => setNotificationsAnchorEl(e.currentTarget)}
        >
          <NotificationsIcon />
        </IconButton>
      </Badge>
      <Menu
        id="notifications-list"
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={() => setNotificationsAnchorEl(null)}
        MenuListProps={{
          "aria-labelledby": "notifications",
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: "200px",
            },
          },
        }}
      >
        {notifications?.map((notification) => (
          <MenuItem
            onClick={() => {
              navigate(
                notification.isRoom
                  ? `/room_chat/${notification.userId}`
                  : `/group_chat/${notification.chatId}`
              );
              setNotificationsAnchorEl(null);
            }}
          >
            <Box>
              <Avatar
                sx={{
                  bgcolor: notification.isRoom
                    ? theme.OTHER_USER_COLOR
                    : theme.CHAT_GROUP_COLOR,
                }}
              >
                {notification.isRoom
                  ? getUserNameAbbreviation(notification.userId)
                  : "GC"}
              </Avatar>
              <Typography fontWeight={notification.isRead ? 300 : 600}>
                {"Received message from " +
                  (notification.isRoom
                    ? getUserName(notification.userId)
                    : "Chat group " + chatGroups[notification.chatId].name)}
              </Typography>
              <Typography gutterBottom>
                {notification.timestamp.toDateString()}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

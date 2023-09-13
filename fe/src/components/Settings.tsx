import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import { AppStateContext } from "../AppStateProvider";
import theme from "./theme";

export default function Settings() {
  const { profile, getUserNameAbbreviation, signOut } =
    useContext(AppStateContext);
  const navigate = useNavigate();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  return (
    <Box>
      <IconButton
        id="settings"
        aria-controls={settingsAnchorEl ? "settings-options" : undefined}
        aria-haspopup="true"
        aria-expanded={settingsAnchorEl ? "true" : undefined}
        onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
      >
        <Avatar
          sx={{
            bgcolor: theme.CURRENT_USER_COLOR,
          }}
        >
          {getUserNameAbbreviation(profile!.id)}
        </Avatar>
      </IconButton>
      <Menu
        id="settings-options"
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        MenuListProps={{
          "aria-labelledby": "settings",
        }}
      >
        <MenuItem>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              padding: "10px",
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.CURRENT_USER_COLOR,
              }}
            >
              {getUserNameAbbreviation(profile!.id)}
            </Avatar>
            <Typography fontWeight="600">
              {profile?.firstName + " " + profile?.lastName}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/profile");
            setSettingsAnchorEl(null);
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
            }}
          >
            <Typography>Edit profile</Typography>
            <EditIcon />
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            signOut();
            setSettingsAnchorEl(null);
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
            }}
          >
            <Typography>Logout</Typography>
            <LogoutIcon />
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}

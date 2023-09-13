import { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { AppStateContext } from "../AppStateProvider";
import Notifications from "./Notifications";
import Settings from "./Settings";

export default function Header() {
  const { token } = useContext(AppStateContext);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyItems: "space-between",
        alignItems: "center",
        padding: "20px",
        width: "100%",
        height: "var(--header-height)",
      }}
    >
      <Box>
        <Typography>WeConnect</Typography>
      </Box>
      {token && (
        <Box>
          <Notifications />
          <Settings />
        </Box>
      )}
    </Box>
  );
}

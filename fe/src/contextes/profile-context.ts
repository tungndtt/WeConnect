import { createContext, useContext } from "react";
import User from "../types/user";

type ProfileState = {
  profile: User | null;
  updateProfile: (update: User) => Promise<void>;
};

export const ProfileContext = createContext<ProfileState>({
  profile: null,
  updateProfile: (_update: User) => new Promise<void>(() => {}),
});

export default function useProfileContext() {
  return useContext(ProfileContext);
};
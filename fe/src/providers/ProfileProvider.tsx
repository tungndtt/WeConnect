import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../contextes/app-context";
import { ProfileContext } from "../contextes/profile-context";
import User from "../types/user";

export default function ProfileProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const [profile, setProfile] = useState<User | null>(null);

  const updateProfile = (update: User) => {
    return new Promise<void>((resolve, reject) => {
      sendRequest("users/profile", "PUT", {
        first_name: undefined || update.firstName,
        last_name: undefined || update.lastName,
        password: update.password,
      })
        .then(() => {
          profile!.firstName ||= update.firstName;
          profile!.lastName ||= update.lastName;
          profile!.password ||= update.password;
          setProfile({ ...profile! });
          resolve();
        })
        .catch(reject);
    });
  };

  useEffect(() => {
    if (token) {
      sendRequest("users/profile", "GET").then((fprofile) => {
        setProfile({
          id: fprofile[0],
          firstName: fprofile[1],
          lastName: fprofile[2],
          email: fprofile[3],
          password: fprofile[4],
        });
      });
    }
  }, [token]);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {props.children}
    </ProfileContext.Provider>
  );
}

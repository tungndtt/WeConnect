type User = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  isOnline?: boolean;
};

export default User;
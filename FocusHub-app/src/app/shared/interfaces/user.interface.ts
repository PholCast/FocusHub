export interface User {
    username: string;
    email: string;
    password: string;
    role:string;
    fullname: string;
    company: string;
    phone?: string;
    jobTitle?: string
  }
import { IsIn } from "class-validator";

export class LoginDto{
    password:string;
    email:string;
}
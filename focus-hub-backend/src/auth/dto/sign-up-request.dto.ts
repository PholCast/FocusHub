import { IsIn } from "class-validator";

export class SignUpDto{
    password:string;
    email:string;
    name:string;
    lastname: string;
}
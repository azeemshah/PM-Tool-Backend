import { SetMetadata } from '@nestjs/common';
import { UserType } from 'src/enum';

export const USER_TYPE_KEY = 'UserTypes';
export const UserTypes = (...types: UserType[]) => SetMetadata(USER_TYPE_KEY, types);

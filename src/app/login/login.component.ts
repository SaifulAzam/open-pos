import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import {TdLoadingService, LoadingType, LoadingMode, TdDialogService} from '@covalent/core';
import {UsersService, AuthService } from '../../services'
import {IUser} from "../../services/users.service";
import {Auth} from "../../services/auth.service";


@Component({
  selector: 'qs-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit{

  username: string;
  password: string;
  user: IUser;

  constructor(private _router: Router,
              private _loadingService: TdLoadingService,
              private _userService: UsersService,
              private _dialogService: TdDialogService,
              private _authService: AuthService) {
    this._loadingService.create({
      name: 'login',
      type: LoadingType.Circular,
      mode: LoadingMode.Indeterminate,
      color: 'warn',
    });
  }

  login(): void {
    this._loadingService.register('login');
    this._userService.login(this.username, this.password).subscribe((data: any) => {
      this._authService.setAuthData(data.id, data.authentication_token).then(()=>{
        this._authService.auth = data;
        this._router.navigate(['dashboard/shops']).then(()=>{
          this._loadingService.resolve('login');
        });

      });

    },() => {
      this._dialogService.openAlert({
        message: 'Unable to login incorrect username or password.',
        disableClose: false,
        title: 'Login Error!',
        closeButton: 'Close',
      });
      this._loadingService.resolve('login');
    });
  }

  ngOnInit(): void {
    this._loadingService.register('login');
    this.user = this._userService.user;
    this._userService.user$.subscribe((data:IUser)=> {
      this.user = data;
      this.checkUser();
    });
    this.checkUser();
  }


  checkUser(): void {
    if (this.user && this.user.active) {
      this._router.navigate(['dashboard/shops']);
    }
    this._loadingService.resolve('login');
  }
}

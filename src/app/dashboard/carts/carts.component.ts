import {Component, OnInit} from '@angular/core';
import {TdLoadingService, LoadingMode, LoadingType} from '@covalent/core';

import {CartService} from "../../../services/cart.service";
import {ActivatedRoute, Router} from "@angular/router";
import {IndexDBServiceService} from "../../../services/indexdb.service";
import {Order} from "../../../services/orders.service";
import {stringify} from "@angular/forms/src/facade/lang";
import {RetailShop, RetailShopsService} from "../../../services/shop.service";
import {MdSnackBar} from "@angular/material";


@Component({
  selector: 'app-carts',
  templateUrl: './carts.component.html',
  styleUrls: ['./carts.component.scss'],
})
export class CartComponent implements OnInit {

  carts: Order[];
  shop_id: string;

  constructor(private _cartService: CartService,
              private _snackBarService: MdSnackBar,
              private _indexDB: IndexDBServiceService,
              private _route: Router,
              private _shopService: RetailShopsService,
              private _loadingService: TdLoadingService) {
    this._loadingService.create({
      name: 'cart',
      type: LoadingType.Circular,
      mode: LoadingMode.Determinate,
      color: 'accent',
    });

  }

  ngOnInit(): void {
    this.setShop();
    this._shopService.shop$.subscribe(() => {
      this.setShop();
    });
  }

  setShop():void{
    this.shop_id = this._shopService.shop.id;
    this.getCarts(this.shop_id);
  }

  getCarts(id: string):void {
    this._indexDB.carts.where({retail_shop_id: id}).toArray().then((data)=>{
      this.carts = data;
    })
  }

  openCart(id: string): void {
    this._loadingService.register('cart');
    this._indexDB.carts.get(id).then((cart)=>{
      this.routeCart(cart.local_id);
      });
    }

  deleteCart(cart: Order): void {
  this._cartService.deleteCart(cart.local_id).then(()=>{
    this.carts.splice(this.carts.indexOf(cart), 1)
  })

  }

  newCart(): void {
    this._loadingService.register('cart');
    if (!this.shop_id) {
      this._snackBarService.open('No outlet selected', '', { duration: 3000 });
      this._route.navigate(['dashboard/shops']).then(()=>{
        this._loadingService.resolve('cart');
      });
      return
    }

    this._cartService.newCart(this.shop_id).then((cartId)=>{
      this.routeCart(cartId);
    });
  }

  routeCart(cartId: string): void {
    this._route.navigate(['billing/'+cartId]).then(()=>{
    this._loadingService.resolve('cart');

    })
  }

}

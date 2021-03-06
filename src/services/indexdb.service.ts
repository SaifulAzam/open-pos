import {Subject, Observable} from "rxjs";

import Dexie  from 'dexie';
import {Product, Distributor, Tag, Brand, Tax, Salt} from "./items.service";
import {Injectable} from "@angular/core";
import {RetailShop} from "./shop.service";
import {Order} from "./orders.service";
import {Locality} from "./customer.service";
import {IUser} from "./users.service";
import {Auth} from "./auth.service";


export interface Status {
  status: boolean;

}


export interface Config {
  stock_time: string;
  shop_id: string;
}

@Injectable()
export class IndexDBServiceService extends Dexie {
  products: Dexie.Table<Product, string>;
  distributors: Dexie.Table<Distributor, string>;
  brands: Dexie.Table<Brand, string>;
  tags: Dexie.Table<Tag, string>;
  salts: Dexie.Table<Salt, string>;
  taxes: Dexie.Table<Tax, string>;
  shops: Dexie.Table<RetailShop, string>;
  orders: Dexie.Table<Order, string>;
  localities: Dexie.Table<Locality, string>;
  auth: Dexie.Table<Auth, string>;
  configs: Dexie.Table<Config, string>;
  carts: Dexie.Table<Order, string>;
  users: Dexie.Table<IUser, string>;

  _db$: Subject<Status> = <Subject<Status>> new Subject;

  constructor() {
    super("myPosDB");
    this.version(1).stores(
      {
        products: "++id,name,retail_shop_id,brand_id",
        distributors: "++id,name,retail_shop_id",
        brands: "++id,name,retail_shop_id",
        tags: "++id,name,retail_shop_id",
        salts: "++id,name,retail_shop_id",
        taxes: "++id,name,retail_shop_id",
        shops: "++id, name",
        orders: "++id",
        carts: "++local_id,retail_shop_id",
        localities: "++id, name",
        users: "++id, mobile_number, email",
        configs: "++shop_id,key,value",
        auth: "++id,authentication_token"
      });
  }
  get db$():Observable<Status>{
    return this._db$.asObservable();
  }
}

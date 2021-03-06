import {Component, OnInit} from "@angular/core";
import {Order, OrdersService} from "../../../services/orders.service";
import {MdDialogRef} from "@angular/material";
import {IndexDBServiceService} from "../../../services/indexdb.service";
import {Customer, CustomerService, Address} from "../../../services/customer.service";
import {RetailShop} from "../../../services/shop.service";
import {Observable} from "rxjs";
import {TdLoadingService, LoadingType, LoadingMode} from "@covalent/core";
import {CartService} from "../../../services/cart.service";


@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  viewProviders: [CustomerService]
})
export class CheckoutComponent implements OnInit {

  cart: Order;
  shop: RetailShop;
  customers: any[];
  customer: Customer = <Customer>{addresses: <Address[]>[]};
  addresses: Address[] = [];
  address: Address = <Address>{};
  digitsArray: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  denominationArray: {} = {1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 500: 0, 1000: 0, 2000: 0};
  total: string = '0';
  ipcRenderer:any;

  constructor(public dialogRef: MdDialogRef<CheckoutComponent>,
              private _customerService: CustomerService,
              private _indexDB: IndexDBServiceService,
              private _orderService: OrdersService,
              private _cartService: CartService,
              private _loadingService: TdLoadingService) {
    this._loadingService.create({
      name: 'checkout',
      type: LoadingType.Circular,
      mode: LoadingMode.Indeterminate,
      color: 'warn',
    });
    try {
      this.ipcRenderer = electron.ipcRenderer;
    }
    catch(err){

    }
  }

  ngOnInit() {
    this._indexDB.shops.get(this.cart.retail_shop_id).then((shop) => {
      this.shop = shop;
    });
    if (this.cart.customer) {
      this.customer = this.cart.customer;
      if (this.customer.id) {
        this.customers = [{display: this.customer.name, value: this.customer.id}];
        this.addCustomer({value: this.customer.id});
      }
    }
    this.cart.address_id = null;
  }

  close(): void {
    this.dialogRef.close();
  }

  enterAmount(digit: string): void {
    this.total += digit;
    this.cart.amount_paid = parseFloat(this.total);
  }

  clearAmount(): void {
    this.total = this.total.slice(0, -1);
    if (this.total.slice(-1) === '.') {
      this.total = this.total.slice(0, -1);
    }
    if (this.total.slice(-2, -1) === '.') {
      this.total = this.total.slice(0, -2);
    }
    this.cart.amount_paid = parseFloat(this.total);
  }

  clearDenomination(): void {
    this.denominationArray = {1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 500: 0, 1000: 0, 2000: 0};
  }


  getCustomers = (event: string): Observable<string[]> => {
    this._loadingService.register('checkout');
    if (parseInt(event)) {
      return this._customerService.query({
        __retail_brand_id__equal: this.shop.retail_brand_id,
        __number__contains: event,
        __limit: 100,
        __only: ['id', 'name', 'mobile_number']
      }).map(data => data.data.map((item) => {
        this._loadingService.resolve('checkout');
        return item
      }), () => {
        console.log('ddd')

      }).catch((error) => {
        this._loadingService.resolve('checkout');
        return Observable.throw(error.json().error)
      })
    }
    else {
      return this._customerService.query({
        __retail_brand_id__equal: this.shop.retail_brand_id, __name__contains: event,
        __limit: 100,
        __only: ['id', 'name', 'mobile_number']
      })
        .map(data => data.data.map((item) => {
          this._loadingService.resolve('checkout');
          return item
        })).catch((error) => {
          this._loadingService.resolve('checkout');
          return Observable.throw(error.json().error)
        })
    }

  };

  addCustomer(event): void {
    if (event) {
      this._customerService.query({
        __id__equal: event.id,
        __include: ['addresses'],
        __limit: 1
      }).subscribe((data: {data: Customer[]}) => {
        this.cart.customer = this.customer = data.data[0];
        this.cart.customer_id = this.customer.id;
        this.saveCart();
        this.addresses = this.customer.addresses;
      });
    }
    else {
      this.clearCustomer();
    }
  }

  checkOut(): void {
    this._loadingService.register('checkout');
    this._orderService.create(this.cart).subscribe((data: {data: Order[]}) => {
      this._cartService.updateStock(this.cart).then((status)=>{
        console.log(status);
        this._loadingService.resolve('checkout');
        this.dialogRef.close(data.data[0].invoice_number);
      });

    }, () => {
      this._loadingService.resolve('checkout');
    })
  }

  saveCustomer(): void {
    this.customer.retail_brand_id = this.shop.retail_brand_id;
    this._customerService.create(this.customer).subscribe((data: {data: Customer[]}) => {
      console.log(data);
        this.cart.customer_id = data.data[0].id;
        this.customer = data.data[0];
    });
  }

  clearCustomer(): void {
    this.cart.customer = null;
    this.cart.customer_id = null;
    this.customer = <Customer>{retail_brand_id: this.shop.retail_brand_id};
    this.customers = [];
    this.addresses = [];
    this.saveCart();
  }

  saveCart(): void {
    this._cartService.setCart(this.cart, this.cart.local_id).then()
  }
  clearAddress():void {
    this.cart.address_id = null;
    this.address.name = null;
  }

  addAddress(): void {
    this._loadingService.register('checkout');
    this._customerService.addAddress(this.address).subscribe((data: {data: Address[]})=>{
      this._customerService.addCustomerAddress(data.data[0].id, this.customer.id).subscribe(()=>{
        this.address.id = data.data[0].id;
        this.addresses = this.addresses.concat(this.address);
        this.cart.address_id = this.address.id;
        this._loadingService.resolve('checkout');
      })
    })
  }

  printBill():void {
    let data:any = {};

    data['shopName'] = this.shop.name;
    data['billDate'] = this.cart.created_on.toLocaleString();
    data['invoice'] = this.cart.reference_number;
    data['items'] = this.cart.items.map((value)=>{
      return {name: value.name, quantity: value.quantity, price: value.total_price}
    });
    data['subTotal'] = this.cart.sub_total || 0;
    data['total'] = this.cart.total || 0;
    data['additionalDiscount'] = this.cart.additional_discount || 0;
    data['autoDiscount'] = this.cart.auto_discount || 0;
    try{
      this.ipcRenderer.send('printBill', data)
      }
      catch(err){

      }

  }

}

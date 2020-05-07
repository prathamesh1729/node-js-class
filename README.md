### Node JS Master Class code

This repo contains code developed as a part of the [Node JS Master class](https://pirple.thinkific.com/courses/take/the-nodejs-master-class/lessons/3810868-logging-to-files).


### Notes

- The `.data` folder has not been .gitignored purposefully so that the code will run as is.
- To set and unset the environment variables in power shell   
  ```shell
  $Env:NODE_DEBUG = 'workers'
  Remove-Item Env:NODE_DEBUG
  ```


### Pizza Delivery Company App

> All related .data folders are with the `p` prefix   
> All related handlers are in the file `lib/api.js`

#### Users API

Authentication via token is required for all Users APIs

- **POST**   
  `name`, `email`, `address`, `password` all fields are mandatory
  ```shell
  curl --location --request POST 'localhost:3000/pizza/users/' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"name": "Prathamesh Joshi",
  	"email": "prathamesh1729@gmail.com",
  	"address": "24 Cuffe Parade, Mumbai, MH, IN",
  	"password": "mypassword"
  }'
  ```
- **GET**   
  `email` in query parameters is mandatory
  ```shell
  curl --location --request GET 'localhost:3000/pizza/users/?email=prathamesh1729@gmail.com' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```
- **PUT**   
  `name`, `email`, `address`, `password` at least one of these fields must be present along with `email` which is mandatory
  ```shell
  curl --location --request PUT 'localhost:3000/pizza/users/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"email": "prathamesh1729@gmail.com",
  	"address": "25 Cuffe Parade, Mumbai - 40001, MH, IN"
  }'
  ```
- **DELETE**    
  `email` in query parameters is mandatory
  ```shell
  curl --location --request DELETE 'localhost:3000/pizza/users/?email=prathamesh1729@gmail.com' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```

#### Tokens API
- **POST** (login)  
  Both `email` and `password` are mandatory
  ```shell
  curl --location --request POST 'localhost:3000/pizza/tokens/' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"email": "prathamesh1729@gmail.com",
  	"password": "mypassword"
  }'
  ```
- **DELETE** (logout)  
  `id` is mandatory which is the token id received upon login
  ```shell
  curl --location --request DELETE 'localhost:3000/pizza/tokens/?id=ccmzek5juiis92kp7d70'
  ```
- ~~PUT~~ (not implemented)
- ~~GET~~ (not implemented)

#### Menu Items API
- **GET**    
  Only authenticated users can access the menu
  ```shell
  curl --location --request GET 'localhost:3000/pizza/menu/' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```  
  To which the response will be
  ```json
  {
    "1": {
        "id": 1,
        "item": "Double Cheese Margherita",
        "price": 5
    },
    "2": {
        "id": 2,
        "item": "Farm House",
        "price": 7
    },
    "3": {
        "id": 3,
        "item": "Country Special",
        "price": 7
    },
    "4": {
        "id": 4,
        "item": "Mexican Green Wave",
        "price": 7
    },
    "5": {
        "id": 5,
        "item": "Veg Exotica",
        "price": 10
    },
    "6": {
        "id": 6,
        "item": "Veggie Paradise",
        "price": 10
    }
  }
  ```

> NOTE: The item id is required in the Cart APIs to add & delete items from cart

#### Cart API

Authentication via token is required for all Cart APIs

- **POST** (add a cart item)     
  `id` is mandatory which is the item id received in the Menu API response   
  `quantity` is an optional field. If not present by default it will add that item by 1
  ```shell
  # Adds an item to the cart with quantity 1.
  # If quantity is specified, it increments by that quantity in the cart
  curl --location --request POST 'localhost:3000/pizza/cart/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"id": "5"
  }'
  ```     
- **PUT** (modify a cart item)     
  `id` is mandatory which is the item id received in the Menu API response   
  `quantity` is also mandatory
  ```shell
  curl --location --request PUT 'localhost:3000/pizza/cart/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"id": "4",
  	"quantity": 1
  }'
  ```    
- **GET** (current cart items)   
  ```shell
  curl --location --request GET 'localhost:3000/pizza/cart/' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```
- **DELETE** (delete a cart item)  
  `id` is optional. If present, that particular item is removed from the cart  
  If not present, the entire cart is cleared
  ```shell
  # If id is specified, removes the item specified by the id from the cart
  # If id is not specified, empties the entire cart
  curl --location --request DELETE 'localhost:3000/pizza/cart/?id=5' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --data-raw ''
  ```


#### Orders API

Authentication via token is required for all Orders APIs

- **POST** (create a new order from current cart & pay)  
  This API creates a new order from existing items in cart (and the cart is emptied).  
  If the payment is successful, order is marked as paid & email is sent to the user
  ```shell
  curl --location --request POST 'localhost:3000/pizza/orders/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --data-raw ''
  ```
- ~~GET (all orders)~~ (Not implemented)

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

#### Users API
- POST   
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
- GET
  ```shell
  curl --location --request GET 'localhost:3000/pizza/users/?email=prathamesh1729@gmail.com' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```
- PUT   
  ```shell
  curl --location --request PUT 'localhost:3000/pizza/users/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"email": "prathamesh1729@gmail.com",
  	"address": "25 Cuffe Parade, Mumbai - 40001, MH, IN"
  }'
  ```
- DELETE   
  ```shell
  curl --location --request DELETE 'localhost:3000/pizza/users/?email=prathamesh1729@gmail.com' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```

#### Tokens API
- POST (login)  
  ```shell
  curl --location --request POST 'localhost:3000/pizza/tokens/' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"email": "prathamesh1729@gmail.com",
  	"password": "mypassword"
  }'
  ```
- DELETE (logout)  
```shell
curl --location --request DELETE 'localhost:3000/pizza/tokens/?id=ccmzek5juiis92kp7d70'
```
- ~~PUT~~ (not implemented)
- ~~GET~~ (not implemented)

#### Menu Items API
- GET   
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
- POST (add a cart item)     
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
- PUT (modify a cart item)     
  ```shell
  curl --location --request PUT 'localhost:3000/pizza/cart/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  	"id": "4",
  	"quantity": 1
  }'
  ```    
- GET (current cart items)   
  ```shell
  curl --location --request GET 'localhost:3000/pizza/cart/' \
  --header 'token: ccmzek5juiis92kp7d70'
  ```
- DELETE (delete a cart item)
  ```shell
  # If id is specified, removes the item specified by the id from the cart
  # If id is not specified, empties the entire cart
  curl --location --request DELETE 'localhost:3000/pizza/cart/?id=5' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --data-raw ''
  ```
#### Orders API
- POST (create a new order from current cart & pay)  
  ```shell
  curl --location --request POST 'localhost:3000/pizza/orders/' \
  --header 'token: ccmzek5juiis92kp7d70' \
  --data-raw ''
  ```
- ~~GET (all orders)~~ (Not implemented)

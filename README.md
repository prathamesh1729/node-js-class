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
- GET
- POST
- PUT
- DELETE

#### Tokens API
- POST (login)
- DELETE (logout)
- ~~PUT~~ (not implemented)
- ~~GET~~ (not implemented)

#### Menu Items API
- GET

#### Cart API
- GET (current cart items)
- POST (add a cart item)
- PUT (modify a cart item)
- DELETE (delete a cart item)

#### Orders API
- GET (all orders)
- POST (create a new order)

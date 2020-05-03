// Dependencies
var _data = require('./data');

// Define the menu export container
var menu = {};

menu.menu = {
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
};

menu.validate = function(menuid) {
  if (menuid in menu.menu) {
    return true;
  } else {
    return false;
  }
};

menu.reload = function() {
  _data.read('pmenu', 'default', function(err, menuData) {
    if (!err && menuData) {
      // Successfully fetched the menu
      menu.menu = menuData;
      callback(false, menuData);
    } else {
      callback(err, menuData);
    }
  });
};

menu.expand = function(map) {
  var expandedMap = [];
  for (var key in map) {
    expandedMap.push({
      'id': key,
      'item': menu.menu[key].item,
      'price': menu.menu[key].price,
      'quantity': map[key]
    });
  }

  return expandedMap;
};

// Export
module.exports = menu;

//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
var _ = require("lodash");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



main().catch(err => console.log(err));

async function main() {
  require("dotenv").config();
  const uri = process.env.MONGODB_URI;
  console.log(uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
  

  const itemSchema = new mongoose.Schema({
    name: String
  });

  const Item = mongoose.model("item", itemSchema);

  const item1 = new Item({
    name: "Morning Pilates"
  });

  const item2 = new Item({
    name: "Study 5 sessions"
  });

  const item3 = new Item({
    name: "Afternoon workout"
  });

  const defaultItems = [item1, item2, item3];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
  });

  const List = mongoose.model("list", listSchema);

  Item.find().then(function(Items){
    if (Items.length === 0) {
      Item.insertMany([item1,item2,item3]).then(function(){
        console.log("Successfully inserted list items into the todolistDB");
      }).catch(function(err){
        console.log(err);
      });
    }
    else {
      console.log("items have been added previously");
    }
  });

  app.get("/", function(req, res) {

  // const day = date.getDate();

    Item.find().then(function(foundItems){
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }).catch(function(err){
      console.log(err);
    });
  });

  app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}).then(function(foundList){
      if(foundList){
        console.log("found an existing list" + foundList);
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
      else
      {
          console.log("no such list exists! Will create a new list.")
          const list = new List({
          name: _.capitalize(customListName),
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
        }
      }).catch(function(err){
      console.log(err);
    });
  });

  app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
      const newItem = new Item({
        name: itemName
      });

      if(listName === "Today") {
        newItem.save();
        res.redirect("/");
      }
      else{
        List.findOne({name: listName}).then(function(foundlist){
          foundlist.items.push(newItem);
          foundlist.save();
          console.log(foundlist);
          res.redirect("/" + listName);
        }).catch(err => {console.log(err);});
      }  
  });

  app.post("/delete", function(req, res){
    const itemID = req.body.checkbox;
    const listTitle = req.body.listName;
    console.log(listTitle);
    console.log(itemID);
    if (listTitle === "Today") {
      Item.findByIdAndDelete(itemID).then(function(){
        console.log("successfully deleted the checkbox item from the home route!");
        res.redirect("/");}).catch(function(err){
          console.log(err);
        }); 
    }
    else {
      List.findOneAndUpdate({name: listTitle}, {$pull: {items: { _id: itemID}}}, {new: true}).then(
        function(updatedList){
          if(updatedList){
            console.log("Successfully deleted the checkbox item from the customer route!");
            res.redirect("/" + listTitle);
          }
          else {
            console.log("List not found.");
          }
        }
      ).catch(function(err){
          console.log(err);
          res.redirect("/");
        });
      }});

  app.get("/about", function(req, res){
    res.render("about");
  });

  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
  });

}


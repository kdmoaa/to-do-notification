// create a reference to the notifications list in the bottom of the app; we will write database messages into this list by
//appending list items on to the inner HTML of this variable - this is all the lines that say note.innerHTML += '<li>foo</li>';
var note = document.getElementById('notifications');

// create an instance of a db object for us to store the IDB data in
var db;

// create a blank instance of the object that is used to transfer data into the IDB. This is mainly for reference
var newItem = [
      { taskTitle: "", hours: 0, minutes: 0, day: 0, month: "", year: 0, notified: "no" }
    ];

// all the variables we need for the app
var taskList = document.getElementById('task-list');

var taskForm = document.getElementById('task-form');
var title = document.getElementById('title');

var hours = document.getElementById('deadline-hours');
var minutes = document.getElementById('deadline-minutes');
var day = document.getElementById('deadline-day');
var month = document.getElementById('deadline-month');
var year = document.getElementById('deadline-year');

var submit = document.getElementById('submit');

var source;



var AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var silent = function() {
    var buf = context.createBuffer(1, 1, 22050);
    var src = context.createBufferSource();
    src.buffer = buf;
    src.connect(context.destination);
    src.start(0);
};

// Audio 用の buffer を読み込む
var getAudioBuffer = function(url, fn) {
    var req = new XMLHttpRequest();
    // array buffer を指定
    req.responseType = 'arraybuffer';

    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 0 || req.status === 200) {
                // array buffer を audio buffer に変換
                context.decodeAudioData(req.response, function(buffer) {
                    // コールバックを実行
                    fn(buffer);
                });
            }
        }
    };

    req.open('GET', url, true);
    req.send('');
};

// サウンドを再生
var loadSound = function(buffer) {
    // source を作成
    this.source = context.createBufferSource();
    // buffer をセット
    this.source.buffer = buffer;
    // context に connect
    this.source.connect(context.destination);
};

var stopSound = function() {
    context.close();
};

window.onload = function() {
  note.innerHTML += '<li>App initialised.</li>';
  // In the following line, you should include the prefixes of implementations you want to test.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  // DON'T use "var indexedDB = ..." if you're not in a function.
  // Moreover, you may need references to some window.IDB* objects:
  indexedDB.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  indexedDB.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
  // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)


  // Let us open our database
  var DBOpenRequest = this.indexedDB.open("toDoList", 4);

  // Gecko-only IndexedDB temp storage option:
  // var request = window.indexedDB.open("toDoList", {version: 4, storage: "temporary"});

  // these two event handlers act on the database being opened successfully, or not
  DBOpenRequest.onerror = function(event) {
    note.innerHTML += '<li>Error loading database.</li>';
  };

  DBOpenRequest.onsuccess = function(event) {
    note.innerHTML += '<li>Database initialised.</li>';

    // store the result of opening the database in the db variable. This is used a lot below
    db = DBOpenRequest.result;

    // Run the displayData() function to populate the task list with all the to-do list data already in the IDB
    displayData();
  };

  // This event handles the event whereby a new version of the database needs to be created
  // Either one has not been created before, or a new version number has been submitted via the
  // window.indexedDB.open line above
  //it is only implemented in recent browsers
  DBOpenRequest.onupgradeneeded = function(event) {
    var db = event.target.result;

    db.onerror = function(event) {
      note.innerHTML += '<li>Error loading database.</li>';
    };

    // Create an objectStore for this database

    var objectStore = db.createObjectStore("toDoList", { keyPath: "taskTitle" });

    // define what data items the objectStore will contain

    objectStore.createIndex("hours", "hours", { unique: false });
    objectStore.createIndex("minutes", "minutes", { unique: false });
    objectStore.createIndex("day", "day", { unique: false });
    objectStore.createIndex("month", "month", { unique: false });
    objectStore.createIndex("year", "year", { unique: false });

    objectStore.createIndex("notified", "notified", { unique: false });

    note.innerHTML += '<li>Object store created.</li>';

    // サウンドを読み込む
    getAudioBuffer('sound.mp3', function(buffer) {
        loadSound(buffer);


        var event = 'click';
        document.addEventListener(event, function() {
            silent();
        });
    });
  };


  function displayData() {
    // first clear the content of the task list so that you don't get a huge long list of duplicate stuff each time
    //the display is updated.
    taskList.innerHTML = "";

    // Open our object store and then get a cursor list of all the different data items in the IDB to iterate through
    var objectStore = db.transaction('toDoList').objectStore('toDoList');
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
        // if there is still another cursor to go, keep runing this code
        if(cursor) {
          // create a list item to put each data item inside when displaying it
          var listItem = document.createElement('li');

          // check which suffix the deadline day of the month needs
          if(cursor.value.day == 1 || cursor.value.day == 21 || cursor.value.day == 31) {
            daySuffix = "st";
          } else if(cursor.value.day == 2 || cursor.value.day == 22) {
            daySuffix = "nd";
          } else if(cursor.value.day == 3 || cursor.value.day == 23) {
            daySuffix = "rd";
          } else {
            daySuffix = "th";
          }

          // build the to-do list entry and put it into the list item via innerHTML.
          listItem.innerHTML = cursor.value.taskTitle + ' — ' + cursor.value.hours + ':' + cursor.value.minutes + ', ' + cursor.value.month + ' ' + cursor.value.day + daySuffix + ' ' + cursor.value.year + '.';

          if(cursor.value.notified == "yes") {
// main
              // 読み込み完了後にボタンにクリックイベントを登録
              listItem.style.textDecoration = "line-through";
              listItem.style.color = "rgba(255,0,0,0.5)";
              // 再生
              this.source.start(0);
          }

          // put the item item inside the task list
          taskList.appendChild(listItem);

          // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
          // function when clicked
          var deleteButton = document.createElement('button');
          listItem.appendChild(deleteButton);
          deleteButton.innerHTML = 'X';
          // here we are setting a data attribute on our delete button to say what task we want deleted if it is clicked!
          deleteButton.setAttribute('data-task', cursor.value.taskTitle);
          deleteButton.onclick = function(event) {
            deleteItem(event);
          }

          // continue on to the next item in the cursor
          cursor.continue();

        // if there are no more cursor items to iterate through, say so, and exit the function
        } else {
          note.innerHTML += '<li>Entries all displayed.</li>';
        }
      }
    }

  // give the form submit button an event listener so that when the form is submitted the addData() function is run
  taskForm.addEventListener('submit',addData,false);

  function addData(e) {
    // prevent default - we don't want the form to submit in the conventional way
    e.preventDefault();

    // Stop the form submitting if any values are left empty. This is just for browsers that don't support the HTML5 form
    // required attributes
    if(title.value == '' || hours.value == null || minutes.value == null || day.value == '' || month.value == '' || year.value == null) {
      note.innerHTML += '<li>Data not submitted — form incomplete.</li>';
      return;
    } else {

      // grab the values entered into the form fields and store them in an object ready for being inserted into the IDB
      var newItem = [
        { taskTitle: title.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value, notified: "no" }
      ];

      // open a read/write db transaction, ready for adding the data
      var transaction = db.transaction(["toDoList"], "readwrite");

      // report on the success of the transaction completing, when everything is done
      transaction.oncomplete = function() {
        note.innerHTML += '<li>Transaction completed: database modification finished.</li>';

        // update the display of data to show the newly added item, by running displayData() again.
        displayData();
      };

      transaction.onerror = function() {
        note.innerHTML += '<li>Transaction not opened due to error: ' + transaction.error + '</li>';
      };

      // call an object store that's already been added to the database
      var objectStore = transaction.objectStore("toDoList");
      console.log(objectStore.indexNames);
      console.log(objectStore.keyPath);
      console.log(objectStore.name);
      console.log(objectStore.transaction);
      console.log(objectStore.autoIncrement);

      // Make a request to add our newItem object to the object store
      var objectStoreRequest = objectStore.add(newItem[0]);
        objectStoreRequest.onsuccess = function(event) {

          // report the success of our request
          // (to detect whether it has been succesfully
          // added to the database, you'd look at transaction.oncomplete)
          note.innerHTML += '<li>Request successful.</li>';

          // clear the form, ready for adding the next entry
          title.value = '';
          hours.value = null;
          minutes.value = null;
          day.value = 01;
          month.value = 'January';
          year.value = 2020;

        };

      };

    };

  function deleteItem(event) {
    // retrieve the name of the task we want to delete
    var dataTask = event.target.getAttribute('data-task');

    // open a database transaction and delete the task, finding it by the name we retrieved above
    var transaction = db.transaction(["toDoList"], "readwrite");
    var request = transaction.objectStore("toDoList").delete(dataTask);

    // report that the data item has been deleted
    transaction.oncomplete = function() {
      // delete the parent of the button, which is the list item, so it no longer is displayed
      event.target.parentNode.parentNode.removeChild(event.target.parentNode);
      note.innerHTML += '<li>Task \"' + dataTask + '\" deleted.</li>';
    };
  };

  // this function checks whether the deadline for each task is up or not, and responds appropriately
  function checkDeadlines() {

    // grab the time and date right now
    var now = new Date();

    // from the now variable, store the current minutes, hours, day of the month (getDate is needed for this, as getDay
    // returns the day of the week, 1-7), month, year (getFullYear needed; getYear is deprecated, and returns a weird value
    // that is not much use to anyone!) and seconds
    var minuteCheck = now.getMinutes();
    var hourCheck = now.getHours();
    var dayCheck = now.getDate();
    var monthCheck = now.getMonth();
    var yearCheck = now.getFullYear();

    // again, open a transaction then a cursor to iterate through all the data items in the IDB
    var objectStore = db.transaction(['toDoList'], "readwrite").objectStore('toDoList');
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
        if(cursor) {

        // convert the month names we have installed in the IDB into a month number that JavaScript will understand.
        // The JavaScript date object creates month values as a number between 0 and 11.
        switch(cursor.value.month) {
          case "January":
            var monthNumber = 0;
            break;
          case "February":
            var monthNumber = 1;
            break;
          case "March":
            var monthNumber = 2;
            break;
          case "April":
            var monthNumber = 3;
            break;
          case "May":
            var monthNumber = 4;
            break;
          case "June":
            var monthNumber = 5;
            break;
          case "July":
            var monthNumber = 6;
            break;
          case "August":
            var monthNumber = 7;
            break;
          case "September":
            var monthNumber = 8;
            break;
          case "October":
            var monthNumber = 9;
            break;
          case "November":
            var monthNumber = 10;
            break;
          case "December":
            var monthNumber = 11;
            break;
          default:
          alert('Incorrect month entered in database.');
        }
          // check if the current hours, minutes, day, month and year values match the stored values for each task in the IDB.
          // The + operator in this case converts numbers with leading zeros into their non leading zero equivalents, so e.g.
          // 09 -> 9. This is needed because JS date number values never have leading zeros, but our data might.
          // The secondsCheck = 0 check is so that you don't get duplicate notifications for the same task. The notification
          // will only appear when the seconds is 0, meaning that you won't get more than one notification for each task
          if(+(cursor.value.hours) == hourCheck && +(cursor.value.minutes) == minuteCheck && +(cursor.value.day) == dayCheck && monthNumber == monthCheck && cursor.value.year == yearCheck && cursor.value.notified == "no") {

            // If the numbers all do match, run the createNotification() function to create a system notification
            createNotification(cursor.value.taskTitle);
          }

          // move on and perform the same deadline check on the next cursor item
          cursor.continue();
        }

    }

  }

  // function for creating the notification
  function createNotification(title) {

    navigator.serviceWorker.register('scripts/sw.js');
    // Let's check if the browser supports notifications

    // first open up a transaction as usual
    var objectStore = db.transaction(['toDoList'], "readwrite").objectStore('toDoList');

    // get the to-do list object that has this title as it's title
    var objectStoreTitleRequest = objectStore.get(title);

    objectStoreTitleRequest.onsuccess = function() {
      // grab the data object returned as the result
      var data = objectStoreTitleRequest.result;

      // update the notified value in the object to "yes"
      data.notified = "yes";

      // create another request that inserts the item back into the database
      var updateTitleRequest = objectStore.put(data);

      // when this new request succeeds, run the displayData() function again to update the display
      updateTitleRequest.onsuccess = function() {
        displayData();
      }
    }
  }

  // using a setInterval to run the checkDeadlines() function every second
  setInterval(checkDeadlines, 1000);
};

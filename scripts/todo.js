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
var playSound = function(buffer) {
    // source を作成
    var source = context.createBufferSource();
    // buffer をセット
    source.buffer = buffer;
    // context に connect
    source.connect(context.destination);
    // 再生
    source.start(0);
};

var stopSound = function() {
    context.close();
};

window.onload = function() {
  note.innerHTML += '<li>App initialised.</li>';

  db = new PouchDB('todoList');
  var remoteCouch = false;
  displayData();

  function displayData() {
    // first clear the content of the task list so that you don't get a huge long list of duplicate stuff each time
    //the display is updated.
    taskList.innerHTML = "";

    // Open our object store and then get a cursor list of all the different data items in the IDB to iterate through
      db
          .allDocs({
              include_docs: true
          })
          .then(function(result) {
                  result.rows.map(function (value) {
                    var doc = value.doc;
                      var listItem = document.createElement('li');
                      if(doc.day == 1 || doc.day == 21 || doc.day == 31) {
                        daySuffix = "st";
                      } else if(doc.day == 2 || doc.day == 22) {
                        daySuffix = "nd";
                      } else if(doc.day == 3 || doc.day == 23) {
                        daySuffix = "rd";
                      } else {
                        daySuffix = "th";
                      }
                      listItem.innerHTML = doc.taskTitle + ' — ' + doc.hours + ':' + doc.minutes + ', ' + doc.month + ' ' + doc.day + daySuffix + ' ' + doc.year + '.';

                      if(doc.notified == "yes") {

                          // 読み込み完了後にボタンにクリックイベントを登録
                          listItem.style.textDecoration = "line-through";
                          listItem.style.color = "rgba(255,0,0,0.5)";
                          // 再生
                          // サウンドを読み込む
                          getAudioBuffer('sound.mp3', function(buffer) {
                              playSound(buffer);
                              var event = 'click';
                              document.addEventListener(event, function() {
                                  silent();
                              });
                          });
                      }

                      // put the item item inside the task list
                      taskList.appendChild(listItem);

                      // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
                      // function when clicked
                      var deleteButton = document.createElement('button');
                      listItem.appendChild(deleteButton);
                      deleteButton.innerHTML = 'X';
                      // here we are setting a data attribute on our delete button to say what task we want deleted if it is clicked!
                      deleteButton.setAttribute('data-task', value.taskTitle);
                      deleteButton.onclick = function(event) {
                        deleteItem(event);
                      }
                 })
          })
    }

  // give the form submit button an event listener so that when the form is submitted the addData() function is run
  taskForm.addEventListener('submit',addData,false);

  function addData(e) {
    // prevent default - we don't want the form to submit in the conventional way
    e.preventDefault();

    // update the display of data to show the newly added item, by running displayData() again.
    displayData();

    db.put(
        { _id: title.value, taskTitle: title.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value, notified: "no" })
        .then(function (response) {
            title.value = '';
            hours.value = null;
            minutes.value = null;
            day.value = 01;
            month.value = 'January';
            year.value = 2020;
        })
        .catch(function (err) {
        })
    };

  function deleteItem(event) {
    // retrieve the name of the task we want to delete
    var dataTask = event.target.getAttribute('data-task');

    db.get(dataTask).then(function(doc){
      return db.remove(doc)
          .then(function () {
              event.target.parentNode.parentNode.removeChild(event.target.parentNode);
          });
    })
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



    db
        .allDocs({
            include_docs: true
        })
        .then(function(result) {
            result.rows.map(function (value) {
              var doc = value.doc;
                switch(doc.month) {
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
                    // alert('Incorrect month entered in database.');
                }
                if(+(doc.hours) == hourCheck && +(doc.minutes) == minuteCheck && +(doc.day) == dayCheck && monthNumber == monthCheck && doc.year == yearCheck && doc.notified == "no") {

                  // If the numbers all do match, run the createNotification() function to create a system notification
                  createNotification(doc.taskTitle);
                }
            })
        })
  }

  // function for creating the notification
  function createNotification(title) {

    navigator.serviceWorker.register('scripts/sw.js');
    // Let's check if the browser supports notifications

      db.get(title).then(function (doc) {
            return db.put({ _id: doc.taskTitle, _rev:doc._rev, taskTitle: doc.taskTitle, hours: doc.hours, minutes: doc.minutes, day: doc.day, month: doc.month, year: doc.year, notified: "yes" })
                .then(function () {
                    displayData();
                })
      });
  }

  // using a setInterval to run the checkDeadlines() function every second
  setInterval(checkDeadlines, 1000);
};

'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

//Parent Class for Workout. Will take in the data that is common for both workouts
class Workout {
  date = new Date(); //setting a class field for Date
  //usually use a library to create a good unique id and not make one on our own
  id = (Date.now() + '').slice(-10); //gets the last 10 numbers of the new date and use as an id
  clicks = 0; //counts for clicks

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  //describing the workout
  _setDescription() {
    // used to tell prettier to ignore the next line
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  //method that counts clicks
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace(); //calling the method automatically in the constructor

    this._setDescription();
  }

  //calculating the pace
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this.calcSpeed(); //calling the method automatically in the constructor

    this._setDescription();
  }

  //calculate the speed
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// Architecture Classes
////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//used to hold all the functions needed to handle all the events as methods
class App {
  // Setting private instance properties of map and mapEvent
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    //Get user's position
    this._getPosition(); //get the position in the constructor so it loads everything. This works because the constructor loads when page loads which will then trigger everything else.

    //Get Data from local storage
    this._getLocalStorage();

    //Attach event handlers
    //checks if form has been submitted
    //so when the form is submitted it will run the _newWorkout method
    form.addEventListener('submit', this._newWorkout.bind(this)); //need to bind the this keyword as the this keyword will originally point to the form and not the class which is what we want

    //listening for change in the drop down menu
    inputType.addEventListener('change', this._toggleElevationField.bind(this));

    //Event listener for centering popup
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Private Methods
  _getPosition() {
    // How to use the GeoLocation API
    // The Geolocation is a browser API/Web API just like the Intl (internalization) API.
    // The Geolocation is a very modern API

    // How to do it
    //getCurrentPosition takes two callback functions with the first being when it succeeds and the second being when there is an error.
    if (navigator.geolocation) {
      // checking to see if the geolocation even exists since its new not all browsers support it
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //need to bind the this keyword to the method has a any simple function calls the this keyword will automatically be undefined so we use the bind method to reassign it.
        function () {
          alert('Could not get your position');
        }
      );
    }
  }
  // Loads the map and its coordinates
  _loadMap(position) {
    //Has a position parameter which will return an object of your location
    //   console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    // what ever we pass in the map method must be the ID name of the element where the map needs to be displayed
    // The L is the main function leaflet gives you simular to Intl is.
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); //first is an array of your coordinates longitude and latitude. The second is the zoom and how close or far you want it

    // console.log(map); //Leaflet object of map with many prototype chains

    //tileLayer - map is made up of small tiles and come from the URL you choose as default its openstreetmap but you can change it to things like google map. We can also use the URL to change the appearance of the map by changing the URL.
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map); //adds it to the map

    //leaflet addEventListener of on() works like addEventListener but was built by leaflet
    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //loading the markers from the local storage
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work); //render marker
    });
  }

  //shows the form
  _showForm(mapE) {
    this.#mapEvent = mapE; //reassigning global variable so we can access it later
    form.classList.remove('hidden'); // when clicked remove class hidden to show the form
    inputDistance.focus(); //focuses on the form
  }

  //hides the from after a submisson
  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ''; //smart way of clearing the fields by allowing them to equal themselves which in the end equals an empty string ''.
    form.style.display = 'none'; //turning display to none so animation doesn't show
    form.classList.add('hidden'); //add the hidden class back on
    setTimeout(() => (form.style.display = 'grid'), 1000); //setting display back to grid after 1 second
  }

  //toggles between forms
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden'); //using the closest method to select the parent element kinda like the reverse query selector
  }

  //creates a new popup
  _newWorkout(e) {
    //Helper function for validating inputs
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); //will loop over the array and check if the number is finite or not and if all are finite then it will return true if not the false

    //Helper function for checking if positive number
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); //checks if all the inputs are greater than 0
    e.preventDefault(); //prevents it from reloading page / default behaviour

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; //getting the value and converting to a number using + (type coercion)
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; //Destructuring the latitude and longitude from the event.
    let workout; // defining it outside the block so it can be used
    //If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!'); //Guard Clause to check if its a number

      //creating running Object
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //If workout cycling, create cycling object
    //instead of using a else it is good to use another if as the if else statement is not really used alot instead guard clauses and if's are used more.
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      //creating cycling Object
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add new object to workouts array
    this.#workouts.push(workout); //pushing workout to the workout private field array
    // console.log(workout);
    //Render workout on map as marker
    //Display The Marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout); //display the workout list on side
    //Hide form + clear input fields

    //Clear Input Fields
    this._hideForm();

    //Set local storage to all workouts
    this._setLocalStorage();
  }

  //renders the workout marker
  _renderWorkoutMarker(workout) {
    //Marker and Pop Up
    L.marker(workout.coords) //using the coordinates we got from the on event listener. Using the Event of mapEvent.latlng; To get the latitude and longitude.
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          //setting the options for the popup
          maxWidth: 250, //max width
          minWidth: 100, //min width
          autoClose: false, // To stop it from closing popup automatically
          closeOnClick: false, // To stop popup from closing when clicking on map
          className: `${workout.type}-popup`, //adding classes to the popup to style it with css
        })
      ) //can add custom popup by using L.popup({}) with some added features you can change
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '} ${workout.description}`
      ) //Sets the text and content of the popup
      .openPopup();
  }

  _renderWorkout(workout) {
    //Dom Manipulation
    //storing html code so it can be used later
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  //Method for centering popup
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return; //Guard clause

    let workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    // console.log(workout);

    // setView is a special method used by leaflet to center the marker on a map, it needs the coordinates and the zoom level. You can also add options in the 3rd argument/parameter for things like animation and its duration
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      //options
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using the public interface
    workout.click();
  }
  _setLocalStorage() {
    //using local storage API -> only advised to use for small amounts of data
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //key value store, and need a string as the object but we can convert an object to a string by using JSON.stringify Local storage is blocking which is bad
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    //Check if there is data
    if (!data) return; //guard clause

    //adding data to the workouts array
    this.#workouts = data;

    //rendering data on the list, looping over the array and rendering each workout
    this.#workouts.forEach(work => {
      this._renderWorkout(work); //renders workout
    });
  }

  //Public interface for reseting lists
  reset() {
    //removing workouts item from local storage
    localStorage.removeItem('workouts');

    //big object that contains a lot of properties and methods and one of them is the ability to reload the page
    location.reload();
  }
}

//creating actual object
const app = new App();
// app._getPosition();

// Access Variable from other scripts.
// console.log(firstName); //Any variable thats global will be available in any other script, as long as they appear after that script

// Leaflet - an open source JS library for mobile friendly interactive maps

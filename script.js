'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// How to use the GeoLocation API
// The Geolocation is a browser API/Web API just like the Intl (internalization) API.
// The Geolocation is a very modern API

// How to do it
//getCurrentPosition takes two callback functions with the first being when it succeeds and the second being when there is an error.
if (navigator.geolocation) {
  // checking to see if the geolocation even exists since its new not all browsers support it
  navigator.geolocation.getCurrentPosition(
    function (position) {
      //Has a position parameter which will return an object of your location
      //   console.log(position);
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(latitude, longitude);
      console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    },
    function () {
      alert('Could not get your position');
    }
  );
}

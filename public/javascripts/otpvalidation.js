// Add event listener to otpform submit event
const form = document.getElementById("otpform");
// Get a reference to the button element
const myButton = document.getElementById("sendOtp");
// Add an event listener for the send otp button click
myButton.addEventListener("click", function (e) {
  e.preventDefault()
  // Code to execute when the send otp button is clicked
  fetch("/sendotp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phonenumber: otpform.phonenumber.value }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "OTP_SEND") {
        }
    })
    .catch((error) => console.error(error));
});



  function validateNumber(event) {
    var input = event.target;
    input.value = input.value.replace(/\D/g, "");
  }

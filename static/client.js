function LoginUser(success) {

	if (success == false) {
		alert("Login unsuccessful, please try a different name.");
	} else {
			//Need to show home page when user login success.
      alert("Login successful");
	}
};

// Login when the user clicks the button
function validateForm() {
  var name = document.getElementById("inputUsername").value;
  if (name.length > 0) {
		//Need to check the authentication with server.
	}
  return false; //To prevent it from going into next page.
};

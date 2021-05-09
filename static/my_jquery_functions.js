/************************************************************
 *	Function 	: jquery function
 *	Description : function which handles the keyboard strokes 
 *	DocumentOwner  : vinay kp	
 *************************************************************/
$(document).ready(function() {
	
    $("#username").keyup(
        function(event) {
            if (event.keyCode == 13) {
                $("#login").click();
            }
        });

    $("#message").keyup(
        function(event) {
            if (event.keyCode == 13) {
                $("#send").click();
            }
        });

    $("#message").focus(
        function() {
            if (this.value == this.defaultValue) {
                this.value = '';
            }
        });
    $("#message").blur(
        function() {
            if (this.value == '') {
                this.value = this.defaultValue;
            }
        });

    $('#call').click(function() {
        var text_value = $("#their-username").val();
        if (text_value == '') {
            alert("Enter peer name");
        }
    });

});
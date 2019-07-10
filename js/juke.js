var dropdown = document.getElementsByClassName("dropdown-btn");
var i;
document.getElementById("demo").innerHTML = "Kucing Firaun";
document.write("Kucing Firaun");
for (i = 0; i < dropdown.length; i++) {
  dropdown[i].addEventListener("click", function() {
  this.classList.toggle("active");
  var dropdownContent = this.nextElementSibling;
  if (dropdownContent.style.display === "block") {
  dropdownContent.style.display = "none";
  } else {
  dropdownContent.style.display = "block";
  }
  });
}

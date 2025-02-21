/*!
 * Start Bootstrap - SB Admin v7.0.7 (https://startbootstrap.com/template/sb-admin)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
 */
//
// Scripts
//

window.addEventListener("DOMContentLoaded", (event) => {
  // Toggle the side navigation
  const sidebarToggle = document.body.querySelector("#sidebarToggle");
  if (sidebarToggle) {
    // Uncomment Below to persist sidebar toggle between refreshes
    // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
    //     document.body.classList.toggle('sb-sidenav-toggled');
    // }
    sidebarToggle.addEventListener("click", (event) => {
      event.preventDefault();
      document.body.classList.toggle("sb-sidenav-toggled");
      localStorage.setItem(
        "sb|sidebar-toggle",
        document.body.classList.contains("sb-sidenav-toggled")
      );
    });
  }
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.target);
    const icon = button.querySelector("i");
    if (target.type === "password") {
      target.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      target.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

function toggleForm(button) {
  // Remove active class from all buttons
  document
    .querySelectorAll(".list-group-item")
    .forEach((item) => item.classList.remove("active"));

  // Add active class to clicked button
  button.classList.add("active");

  // Hide all forms
  document.querySelectorAll(".card.mb-4").forEach((form) => {
    form.classList.add("d-none");
  });

  // Show the target form
  const target = document.querySelector(button.dataset.target);
  target.classList.remove("d-none");
}

// AKSI TOLAK/TERIMA
const confirmModal = document.getElementById("confirmModal");
confirmModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  const message = button.getAttribute("data-message");

  // Update form action and hidden input value
  const form = document.getElementById("confirmForm");
  form.action = action;
  document.getElementById("confirmId").value = id;

  // Update modal message
  document.getElementById("confirmMessage").textContent = message;
});

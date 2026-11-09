const feedButtons = { listings: document.querySelector("#show-listings"), blogs: document.querySelector("#show-blogs") };
const feeds = { listings: document.querySelector("#listings-feed"), blogs: document.querySelector("#blogs-feed") };

function showFeed(name) {
  for (const key in feeds) {
    feeds[key].hidden = key !== name;
    feedButtons[key].setAttribute("aria-pressed", String(key === name));
  }
}

if (feedButtons.listings) {
  for (const key in feedButtons) feedButtons[key].addEventListener("click", () => showFeed(key));
  if (window.location.hash === "#blogs") showFeed("blogs");
}

const profileTabs = document.querySelector("#profile-tabs");

function showTab(name) {
  profileTabs.dataset.active = name; // CSS moves the slider.
  for (const tab of ["posts", "favorites"]) {
    const button = document.querySelector("#show-" + tab);
    const section = document.querySelector("#profile-" + tab);
    if (!button) continue; // This account does not have that section.
    button.setAttribute("aria-selected", String(tab === name));
    section.hidden = tab !== name;
  }
}

if (profileTabs) {
  for (const button of profileTabs.querySelectorAll("button")) {
    button.addEventListener("click", () => showTab(button.id.replace("show-", "")));
  }
  const hashTab = window.location.hash.slice(1);
  if (document.querySelector("#show-" + hashTab)) showTab(hashTab);
}

const photographerFields = document.querySelector("#photographer-fields");
const roleButtons = document.querySelectorAll("input[name='role']");
const photographerRole = document.querySelector("input[value='photographer']");

function changeRole() {
  document.querySelector("#role-switch").dataset.role = photographerRole.checked ? "photographer" : "user";
  photographerFields.hidden = !photographerRole.checked;
  for (const input of photographerFields.querySelectorAll("input")) {
    input.required = photographerRole.checked;
    input.disabled = !photographerRole.checked;
  }
}

if (photographerFields) {
  for (const button of roleButtons) button.addEventListener("change", changeRole);
  changeRole();
}

const deleteAccountForm = document.querySelector("#delete-account-form");
function confirmDelete(event) {
  if (!window.confirm("Permanently delete your account and posts?")) {
    event.preventDefault(); // Cancel keeps the account and stays on this page.
  }
}
if (deleteAccountForm) deleteAccountForm.addEventListener("submit", confirmDelete);

function moveMedia(event) {
  const button = event.currentTarget;
  const gallery = button.closest(".listing-media");
  const slides = gallery.querySelectorAll(".media-slide");
  let index = Number(gallery.dataset.index);
  slides[index].hidden = true;
  const direction = button.classList.contains("media-next") ? 1 : -1;
  index = (index + direction + slides.length) % slides.length;
  slides[index].hidden = false;
  gallery.dataset.index = index;
  gallery.querySelector(".media-count").textContent = (index + 1) + " / " + slides.length;
}

for (const button of document.querySelectorAll(".media-prev, .media-next")) {
  button.addEventListener("click", moveMedia);
}

window.addEventListener("load", () => {
  const toast = document.querySelector("#app-toast");
  if (!toast) return;
  if (window.bootstrap) return window.bootstrap.Toast.getOrCreateInstance(toast).show();
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3500);
});

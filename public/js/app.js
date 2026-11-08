const listingsButton = document.querySelector("#show-listings");
const blogsButton = document.querySelector("#show-blogs");
const listingsSection = document.querySelector("#listings-feed");
const blogsSection = document.querySelector("#blogs-feed");

if (listingsButton && blogsButton && listingsSection && blogsSection) {
  listingsButton.addEventListener("click", () => {
    listingsSection.hidden = false;
    blogsSection.hidden = true;
    listingsButton.setAttribute("aria-pressed", "true");
    blogsButton.setAttribute("aria-pressed", "false");
  });

  blogsButton.addEventListener("click", () => {
    listingsSection.hidden = true;
    blogsSection.hidden = false;
    listingsButton.setAttribute("aria-pressed", "false");
    blogsButton.setAttribute("aria-pressed", "true");
  });

  if (window.location.hash === "#blogs") blogsButton.click();
}

const roleInputs = document.querySelectorAll('input[name="role"]');
const photographerFields = document.querySelector("#photographer-fields");

if (roleInputs.length && photographerFields) {
  const updatePhotographerFields = () => {
    const isPhotographer = document.querySelector(
      'input[name="role"]:checked',
    ).value === "photographer";
    photographerFields.hidden = !isPhotographer;
    photographerFields
      .querySelectorAll("input")
      .forEach((input) => (input.required = isPhotographer));
  };

  roleInputs.forEach((input) =>
    input.addEventListener("change", updatePhotographerFields),
  );
  updatePhotographerFields();
}
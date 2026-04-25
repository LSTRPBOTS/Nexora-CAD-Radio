// NEW Nexora Login Script
// Replaces old username/password system

function login() {
    const name = document.getElementById("name").value.trim();
    const badge = document.getElementById("badge").value.trim();
    const role = document.getElementById("role").value;

    if (!name || !badge) {
        alert("Enter name and badge/unit ID.");
        return;
    }

    const user = {
        name,
        badge,
        role,
        settings: {
            radioName: "",
            radioImage: "",
            pttKey: "KeyT",
            panicKey: "KeyP",
            frequency: "154.890",
            panicButtonLabel: "PANIC",
            showWhoIsTalking: true
        }
    };

    localStorage.setItem("currentUser", JSON.stringify(user));

    // Redirect based on role
    if (role === "cad") window.location.href = "./cad.html";
    if (role === "mdt") window.location.href = "./mdt.html";
    if (role === "radio") window.location.href = "./radio.html";
    if (role === "admin") window.location.href = "./admin.html";
}

// ==========================================
// CAMPUS HORIZON - VOICE NAVIGATION
// ==========================================

export function speak(message) {

    if (!("speechSynthesis" in window)) {
        console.error("Speech synthesis is not supported.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(message);

    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
}


// Speak a single navigation instruction
export function speakTurn(direction, distance) {

    let message = "";

    if (direction === "left") {

        message =
            `In ${distance} meters, turn left.`;

    } else if (direction === "right") {

        message =
            `In ${distance} meters, turn right.`;

    } else if (direction === "straight") {

        message =
            `Continue straight for ${distance} meters.`;

    } else if (direction === "uturn") {

        message =
            `In ${distance} meters, make a U-turn.`;

    }

    speak(message);
}


// Arrival message
export function speakArrival(destination) {

    speak(
        `You have arrived at ${destination}.`
    );
}
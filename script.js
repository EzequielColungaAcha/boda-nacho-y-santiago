const WEDDING_DATE = new Date("2026-11-14T19:00:00-03:00");

const SONG_FORM = {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSeLMes4AoOYOAoFUVAY0mQyvsKnBTLkhQQjQz7LKyHu-L1FtQ/viewform", // https://docs.google.com/forms/d/e/FORM_ID/formResponse
    entrySong: "entry.732562816",
    entryArtist: "entry.29381079",
    entryName: "entry.302964789",
};

const RSVP_FORM = {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSdgIUNogsZ2ZTnMel4qa0MvGk6P34t7SdOxYJNVvPKYKSmCwg/viewform", // https://docs.google.com/forms/d/e/FORM_ID/formResponse
    entryName: "entry.554485960",
    entryAttend: "entry.715880741",
    entryGuests: "entry.656991603",
};

function googleFormAction(url) {
    return String(url || "")
        .trim()
        .replace(/\/viewform.*$/i, "/formResponse")
        .replace(/\/edit.*$/i, "/formResponse");
}

async function postGoogleForm(config, fields) {
    const action = googleFormAction(config.action);
    if (!action) {
        throw new Error("missing-action");
    }
    const body = new FormData();
    for (const [entry, value] of fields) {
        if (entry && value !== undefined && value !== null && value !== "") {
            body.append(entry, value);
        }
    }
    await fetch(action, { method: "POST", mode: "no-cors", body });
}

function updateCountdown() {
    const now = new Date();
    let diff = WEDDING_DATE.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;

    const days = Math.floor(diff / day);
    const hours = Math.floor((diff % day) / hour);
    const minutes = Math.floor((diff % hour) / minute);
    const seconds = Math.floor((diff % minute) / second);

    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    set("count-days", String(days));
    set("count-hours", String(hours));
    set("count-minutes", String(minutes));
    set("count-seconds", String(seconds));
}

function initAudio() {
    const audio = document.getElementById("our-song");
    const button = document.getElementById("play-song");
    if (!audio || !button) return;

    const playIcon = button.querySelector("[data-icon='play']");
    const pauseIcon = button.querySelector("[data-icon='pause']");

    const render = () => {
        const playing = !audio.paused;
        button.setAttribute("aria-pressed", String(playing));
        button.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
        playIcon.classList.toggle("is-hidden", playing);
        pauseIcon.classList.toggle("is-hidden", !playing);
    };

    button.addEventListener("click", async () => {
        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (error) {
            button.title = "No se pudo reproducir la canción";
        }
        render();
    });

    audio.addEventListener("ended", render);
    audio.addEventListener("pause", render);
    audio.addEventListener("play", render);
    render();
}

function initGallery() {
    const track = document.querySelector(".gallery-track");
    const slides = track ? Array.from(track.querySelectorAll("img")) : [];
    if (!track || slides.length === 0) return;

    let index = 0;
    const dots = document.querySelector(".dots");

    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Foto ${i + 1}`);
        dot.addEventListener("click", () => go(i));
        dots.appendChild(dot);
    });

    const go = (next) => {
        index = (next + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        Array.from(dots.children).forEach((dot, i) => {
            dot.classList.toggle("is-active", i === index);
        });
    };

    document.querySelector(".gallery-nav.prev")?.addEventListener("click", () => go(index - 1));
    document.querySelector(".gallery-nav.next")?.addEventListener("click", () => go(index + 1));

    let startX = 0;
    track.addEventListener("pointerdown", (event) => {
        startX = event.clientX;
        track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointerup", (event) => {
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
    });

    go(0);
}

function initRsvp() {
    const form = document.getElementById("rsvp-form");
    const thanks = document.getElementById("rsvp-thanks");
    const error = document.getElementById("rsvp-error");
    if (!form || !thanks) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = String(data.get("nombre") || "").trim();
        const attend = data.get("asistiras");
        const guests = data.get("cantidad");

        if (!name || !attend || guests === null || guests === "") {
            error.textContent = "Por favor completa todos los campos.";
            return;
        }

        error.textContent = "";
        try {
            await postGoogleForm(RSVP_FORM, [
                [RSVP_FORM.entryName, name],
                [RSVP_FORM.entryAttend, attend],
                [RSVP_FORM.entryGuests, guests],
            ]);
        } catch (err) {
            error.textContent = err.message === "missing-action"
                ? "Falta la URL del formulario."
                : "No se pudo enviar. Intenta de nuevo.";
            return;
        }

        form.classList.add("is-hidden");
        thanks.classList.add("is-visible");
    });
}

function initSongForm() {
    const form = document.getElementById("song-form");
    const thanks = document.getElementById("song-thanks");
    const error = document.getElementById("song-error");
    if (!form || !thanks) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const song = String(data.get("cancion") || "").trim();
        const artist = String(data.get("artista") || "").trim();
        const name = String(data.get("nombre") || "").trim();

        if (!song || !artist) {
            error.textContent = "Por favor indica la canción y el artista.";
            return;
        }

        error.textContent = "";
        try {
            await postGoogleForm(SONG_FORM, [
                [SONG_FORM.entrySong, song],
                [SONG_FORM.entryArtist, artist],
                [SONG_FORM.entryName, name],
            ]);
        } catch (err) {
            error.textContent = err.message === "missing-action"
                ? "Falta la URL del formulario."
                : "No se pudo enviar. Intenta de nuevo.";
            return;
        }

        form.classList.add("is-hidden");
        thanks.classList.add("is-visible");
    });
}

function guestNamesFromParams() {
    const params = new URLSearchParams(window.location.search);
    const nombres = params.getAll("nombres").map((value) => value.trim()).filter(Boolean);
    const para = (params.get("para") || params.get("nombre") || params.get("invitados") || "").trim();
    const lines = [];
    if (para) lines.push(para);
    lines.push(...nombres);
    if (lines.length === 0) lines.push("Invitados");
    return lines;
}

function whenWindowLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

function whenMediaReady(el) {
    if (!el) return Promise.resolve();
    if (el.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return Promise.resolve();
    return new Promise((resolve) => {
        const done = () => {
            el.removeEventListener("canplaythrough", done);
            el.removeEventListener("error", done);
            resolve();
        };
        el.addEventListener("canplaythrough", done);
        el.addEventListener("error", done);
    });
}

function initGate() {
    const gate = document.getElementById("gate");
    const list = document.getElementById("gate-names");
    const main = document.getElementById("inicio");
    const continueBtn = document.getElementById("gate-continue");
    if (!gate || !list || !main) return;

    for (const name of guestNamesFromParams()) {
        const line = document.createElement("p");
        line.textContent = name;
        list.appendChild(line);
    }

    let entered = false;
    const enter = () => {
        if (entered || !gate.classList.contains("is-ready")) return;
        entered = true;

        const audio = document.getElementById("our-song");
        const video = document.querySelector(".hero-bg");
        audio?.play().catch(() => {});
        video?.play().catch(() => {});

        gate.classList.add("is-done");
        gate.setAttribute("aria-busy", "false");
        continueBtn?.setAttribute("aria-hidden", "true");
        continueBtn?.blur();
        main.removeAttribute("inert");
        document.body.classList.remove("is-gated");
        history.scrollRestoration = "manual";
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        requestAnimationFrame(() => {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
    };

    gate.addEventListener("click", enter);
    continueBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        enter();
    });

    Promise.all([
        document.fonts.ready,
        whenWindowLoaded(),
        whenMediaReady(document.getElementById("our-song")),
        whenMediaReady(document.querySelector(".hero-bg")),
    ]).then(() => {
        gate.classList.add("is-ready");
        gate.setAttribute("aria-busy", "false");
        if (continueBtn) {
            continueBtn.setAttribute("aria-hidden", "false");
            continueBtn.removeAttribute("tabindex");
        }
    });
}

updateCountdown();
setInterval(updateCountdown, 1000);
initAudio();
initGallery();
initRsvp();
initSongForm();
initGate();

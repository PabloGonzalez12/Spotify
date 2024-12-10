const audio = document.getElementById("audio");

let cachedSongs = []; // Variable global para almacenar las canciones

// Función para obtener canciones de la API
async function fetchSongs() {
    try {
        const response = await fetch('http://informatica.iesalbarregas.com:7007/songs');
        if (!response.ok) throw new Error('Error al obtener canciones');
        const songs = await response.json();
        cachedSongs = songs; // Almacenar canciones en la variable global
        return songs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Mostrar canciones en la tabla
async function renderSongs(songs, filter = 'all') {
    const tbody = document.querySelector('#table-container tbody');
    tbody.innerHTML = ''; // Limpia el tbody antes de renderizar

    // Filtrar canciones según el filtro activo
    const filteredSongs = filter === 'favorites'
        ? songs.filter(song => isFavorite(song.id))
        : songs;

    for (const song of filteredSongs) {
        const tr = document.createElement('tr');
        tr.dataset.id = song.id;

        const playIconCell = document.createElement('td');
        playIconCell.innerHTML = `
            <div class="icon-table-play">
                <i class='bx bx-play' style='color:#ffffff'></i>
            </div>
        `;

        const titleCell = document.createElement('td');
        titleCell.textContent = song.title;

        const artistCell = document.createElement('td');
        artistCell.textContent = song.artist;

        // Configurar el archivo de audio y su duración
        const tempAudio = new Audio(song.filepath);
        tempAudio.addEventListener('loadedmetadata', () => {
            const durationCell = document.createElement('td');
            durationCell.textContent = formatDuration(tempAudio.duration);

            const favoriteIconCell = document.createElement('td');
            favoriteIconCell.innerHTML = `
                <i class='favorite-icon ${isFavorite(song.id) ? 'bx bxs-heart' : 'bx bx-heart'}'></i>
            `;

            const imgpathCell = document.createElement('td');
            imgpathCell.textContent = song.cover;
            imgpathCell.classList.add("hidden");

            const filepathCell = document.createElement('td');
            filepathCell.textContent = song.filepath;
            filepathCell.classList.add("hidden");

            tr.appendChild(imgpathCell);
            tr.appendChild(playIconCell);
            tr.appendChild(titleCell);
            tr.appendChild(artistCell);
            tr.appendChild(durationCell);
            tr.appendChild(favoriteIconCell);
            tr.appendChild(filepathCell);

            // Agregar eventos
            favoriteIconCell.querySelector('.favorite-icon').addEventListener('click', () => {
                toggleFavorite(song.id);
                renderSongs(cachedSongs, filter); // Actualizar vista
            });


            playIconCell.querySelector('.bx-play').addEventListener('click', () => playSong(song.filepath, song.cover, tr, song.title, song.artist));
        });

        tbody.appendChild(tr);
    }
}

// Agregar funcionalidad a los filtros
document.getElementById('todos').addEventListener('click', () => {
    renderSongs(cachedSongs, 'all'); // Usar canciones cacheadas
});

document.getElementById('favoritos').addEventListener('click', () => {
    renderSongs(cachedSongs, 'favorites'); // Usar canciones cacheadas
});

// Guardar/Eliminar favoritos en localStorage
function toggleFavorite(songId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.includes(songId)) {
        // Si ya está en favoritos, eliminarlo
        const index = favorites.indexOf(songId);
        favorites.splice(index, 1);
    } else {
        // Si no está en favoritos, agregarlo
        favorites.push(songId);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Verificar si una canción es favorita
function isFavorite(songId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.includes(songId);
}



// Función para formatear la duración
function formatDuration(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60); 
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}




// Botones para navegar entre canciones
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

// Índice actual de la canción
let currentSongIndex = 0;

// Función para reproducir una canción por índice
function playSongByIndex(index) {
    // Obtener la canción actual
    const song = cachedSongs[index]; 
    if (!song) {
        console.error("No hay canciones en la lista.");
        return;
    }

    // Buscar la fila de la canción
    const row = document.querySelector(`tr[data-id="${song.id}"]`); 
    // Reproducir la canción
    playSong(song.filepath, song.cover, row, song.title, song.artist); 
}

// Evento para botón "Anterior"
prevButton.addEventListener("click", () => {
    // Ir al final si es el principio
    currentSongIndex = (currentSongIndex - 1 + cachedSongs.length) % cachedSongs.length; 
    playSongByIndex(currentSongIndex);
});

// Evento para botón "Siguiente"
nextButton.addEventListener("click", () => {
    // Volver al inicio si es el final
    currentSongIndex = (currentSongIndex + 1) % cachedSongs.length; 
    playSongByIndex(currentSongIndex);
});




const repeatButton = document.getElementById("repeat");
let isRepeatActive = false;

const shuffleButton = document.getElementById("shuffle");
let isShuffleActive = false;

// Evento para alternar el estado del bucle
repeatButton.addEventListener("click", () => {
    isRepeatActive = !isRepeatActive;
    if (isRepeatActive) {
        repeatButton.style.color = "var(--primary-color)";
        isShuffleActive = !isShuffleActive;
        shuffleButton.style.color = "var(--white)";
    } else {
        repeatButton.style.color = "var(--white)";
    }

    if (isShuffleActive) {
        shuffleButton.style.color = "var(--white)";
    }
});


// Evento para el aleatorio
shuffleButton.addEventListener("click", () => {
    isShuffleActive = !isShuffleActive;
    if (isShuffleActive) {
        shuffleButton.style.color = "var(--primary-color)";
        isRepeatActive = !isShuffleActive;
        repeatButton.style.color = "var(--white)";
    } else {
        shuffleButton.style.color = "var(--white)";
    }
});



// Evento para manejar el final de la canción
audio.addEventListener("ended", () => {
    if (isShuffleActive) {
        // Reproducir una canción aleatoria
        const randomIndex = getRandomSongIndex();
        playSongByIndex(randomIndex);
    } else if (isRepeatActive) {
        // Reproducir la misma canción desde el principio si el bucle está activo
        audio.currentTime = 0;
        audio.play();
    } else {
        // Reproducir la siguiente canción
        currentSongIndex = (currentSongIndex + 1) % cachedSongs.length;
        playSongByIndex(currentSongIndex);
    }
});



// Función para obtener un índice aleatorio
function getRandomSongIndex() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * cachedSongs.length); // Generar un índice aleatorio
    } while (randomIndex === currentSongIndex && cachedSongs.length > 1); // Evitar repetir la misma canción
    return randomIndex;
}



// Funcion para seleccionar una cancion
function playSong(filepath, cover, row, title, artist) {
    const currentRow = document.querySelector(".currentRow");
    const imgContainer = document.querySelector("#img-container");
    let img = imgContainer.querySelector("img");

    if (!img) {
        img = document.createElement("img");
        imgContainer.appendChild(img);
    }

    const buttonPlayPause = document.getElementById("play-pause");

    // Detener cualquier canción en reproducción
    if (audio.src !== filepath) {
        audio.pause();
        if (currentRow) {
            currentRow.classList.remove("currentRow");
        }
    }

    // Actualizar la canción si es diferente
    if (audio.src !== filepath) {
        let spanTitle = document.querySelector('.footer-left span:nth-child(1)');
        let spanArtist = document.querySelector('.footer-left span:nth-child(2)');
        let duration = document.querySelector('#duration');

        spanTitle.textContent = title;
        spanArtist.textContent = artist;

        const tempAudio = new Audio(filepath);
        tempAudio.addEventListener('loadedmetadata', () => {
            duration.textContent = formatDuration(tempAudio.duration);
        });
        

        // Actualizar el índice de la canción actual
        currentSongIndex = cachedSongs.findIndex(song => song.filepath === filepath);

        audio.src = filepath;
        img.src = cover;
        audio.play();
        row.classList.add("currentRow");
        buttonPlayPause.textContent = "PAUSE";
        document.querySelector(".footer-icons span:nth-child(3) i").classList.remove("bx-play-circle");
        document.querySelector(".footer-icons span:nth-child(3) i").classList.add("bx-pause-circle");
    } else {
        // Si ya está en reproducción, pausar o continuar
        if (audio.paused) {
            audio.play();
            buttonPlayPause.textContent = "PAUSE";
        } else {
            audio.pause();
            buttonPlayPause.textContent = "PLAY";
        }
    }
}



const buttonPlayPause = document.getElementById("play-pause");
const iconPlayPause = document.querySelector(".footer-icons span:nth-child(3) i");

// Funcion para alternar entre play y pause
function togglePlayPause() {
    if (!audio.src || audio.src === window.location.href) {
        // No hay canción seleccionada
        alert("Por favor, selecciona una canción primero.");
        return;
    }

    if (audio.paused) {
        audio.play();
        buttonPlayPause.textContent = "PAUSE";
        document.querySelector(".footer-icons span:nth-child(3) i").classList.remove("bx-play-circle");
        document.querySelector(".footer-icons span:nth-child(3) i").classList.add("bx-pause-circle");
    } else {
        audio.pause();
        buttonPlayPause.textContent = "PLAY";
        document.querySelector(".footer-icons span:nth-child(3) i").classList.remove("bx-pause-circle");
        document.querySelector(".footer-icons span:nth-child(3) i").classList.add("bx-play-circle");
    }
}

buttonPlayPause.addEventListener("click", togglePlayPause);
iconPlayPause.addEventListener("click", togglePlayPause);






const volumeProgressBar = document.getElementById("volumeProgressBar");
// Actualizar el volumen del audio
volumeProgressBar.addEventListener("click", (e) => {
    const volumeValue = volumeProgressBar.value / 100; // Escalar el valor a 0-1
    audio.volume = volumeValue;
    updateVolumeIcon(volumeValue);
});

// Cambiar el ícono del volumen según el nivel
function updateVolumeIcon(volume) {
    const volumeIcon = document.getElementById("volume-icon");
    if (volume === 0) {
        volumeIcon.className = "bx bx-volume-mute";
    } else if (volume < 0.5) {
        volumeIcon.className = "bx bx-volume-low";
    } else {
        volumeIcon.className = "bx bx-volume-full";
    }
}

// Capturar clics y calcular el nuevo valor
volumeProgressBar.addEventListener("click", (e) => {
    const rect = volumeProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left; // Posición del clic
    const width = rect.width; // Ancho total del progreso
    const newValue = Math.round((clickX / width) * volumeProgressBar.max);
    volumeProgressBar.value = newValue;
});




const songProgressBar = document.getElementById("songProgressBar");
const currentTimeSpan = document.getElementById("currentTime");

// Actualizar la barra de progreso mientras se reproduce la canción
audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration)) {
        const progressValue = (audio.currentTime / audio.duration) * 100;
        songProgressBar.value = progressValue;

        // Actualizar el tiempo actual mostrado
        currentTimeSpan.textContent = formatDuration(audio.currentTime);
    }
});

// Permitir que el usuario haga clic en el progreso para cambiar la posición de reproducción
songProgressBar.addEventListener("click", (e) => {
    const rect = songProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left; // Posición del clic
    const width = rect.width; // Ancho total del progreso
    const newTime = (clickX / width) * audio.duration;

    audio.currentTime = newTime; // Cambiar la posición de reproducción
});






// Al hacer clic en el botón de agregar a la cola
document.querySelector(".bxs-add-to-queue").addEventListener("click", () => {
    // Crear el contenido del modal
    const modalHTML = `
        <div id="modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <i class='bx bx-x' id="close-modal" style="cursor: pointer;"></i>
                </div>
                <form id="uploadForm" enctype="multipart/form-data" method="POST">
                    <label for="addSong">Añadir nueva canción</label>
                    <div id="addSongLabel">Seleccionar archivo</div>
                    <input type="file" name="music" id="addSong" required> <!-- Cambié 'addSong' a 'music' -->

                    <label for="addTitle">Titulo</label>
                    <input type="text" name="title" id="addTitle" required> <!-- Cambié 'addTitle' a 'title' -->

                    <label for="addAuthor">Autor</label>
                    <input type="text" name="artist" id="addAuthor" required> <!-- Cambié 'addAuthor' a 'artist' -->

                    <label for="addImage">Imagen de portada</label>
                    <div id="addImageLabel">Seleccionar archivo</div>
                    <input type="file" name="cover" id="addImage" required> <!-- Cambié 'addImage' a 'cover' -->

                    <button type="submit">Subir</button>
                </form>
            </div>
        </div>
    `;

    // Insertar el modal en el cuerpo del documento
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Obtener referencias a los elementos del modal
    const modal = document.getElementById("modal");
    const uploadForm = document.getElementById("uploadForm");
    const addSongLabel = document.getElementById("addSongLabel");
    const addSongInput = document.getElementById("addSong");
    const addImageLabel = document.getElementById("addImageLabel");
    const addImageInput = document.getElementById("addImage");
    const closeModalButton = document.getElementById("close-modal");

    // Manejar clic en la etiqueta para seleccionar archivo de canción
    addSongLabel.addEventListener("click", () => {
        addSongInput.click();
    });

    // Manejar clic en la etiqueta para seleccionar archivo de imagen
    addImageLabel.addEventListener("click", () => {
        addImageInput.click();
    });

    // Manejar el envío del formulario
    uploadForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevenir el envío por defecto del formulario

        // Crear un objeto FormData con los datos del formulario
        const formData = new FormData(uploadForm);

        // Realizar la petición POST a la API
        fetch("http://informatica.iesalbarregas.com:7007/upload", {
            method: "POST",
            body: formData,
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error en la subida de archivo");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Archivo subido con éxito:", data);
            alert("Archivo subido correctamente");
            location.reload();
            uploadForm.reset();
            closeModal(); // Cerrar el modal después del envío exitoso
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Hubo un error al subir el archivo.");
        });
    });

    // Función para cerrar el modal
    function closeModal() {
        modal.remove();
    }

    // Manejar el clic en el botón de cerrar
    closeModalButton.addEventListener("click", closeModal);

    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});




// Función inicial para cargar canciones
document.addEventListener('DOMContentLoaded', async () => {
    const songs = await fetchSongs();
    renderSongs(songs);
});
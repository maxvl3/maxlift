document.addEventListener('DOMContentLoaded', () => {
    // Controleer of de body het id 'home' heeft
    if (document.body.id === 'home') {
        const addExerciseButton = document.querySelector('.add-exercise');
        const exercisePopup = document.querySelector('.exercise-popup');
        const closeExerciseButton = document.querySelector('.close-newexercise');
        const exerciseNameInput = document.getElementById('exerciseName');

        addExerciseButton.addEventListener('click', () => {
            exercisePopup.style.visibility = 'visible';
            exerciseNameInput.focus();
        });

        closeExerciseButton.addEventListener('click', () => {
            exercisePopup.style.visibility = 'hidden';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
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
});

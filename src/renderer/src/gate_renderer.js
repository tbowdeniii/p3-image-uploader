api.handle('key-suspended', () => {
    let suspendText = document.getElementById('license-label')
    suspendText.innerText =
        'Your license key is suspended. Please contact license@p3pricetags.com to resolve this issue!'

    suspendText.classList.add('red')
})

api.handle('key-not-found', () => {
    let notFoundText = document.getElementById('license-label')
    notFoundText.innerText = `The license key you entered was not found.
        Please enter a valid license key.
        If you think this is a mistake, please contact license@p3pricetags.com`
    notFoundText.classList.add('yellow')
})

window.addEventListener('DOMContentLoaded', () => {
    const gate = document.getElementById('gate-submit')
    const gateInput = document.getElementById('license-input')

    gateInput.addEventListener('change', () => {
        const gateInputValue = document.getElementById('license-input').value
        console.log(gateInputValue)
        if (gateInputValue != '') {
            console.log("you're good bro")
            gate.removeAttribute('disabled')
        } else {
            gate.setAttribute('disabled', 'disabled')
        }
    })
})
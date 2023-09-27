class UserLogin extends HTMLElement {
    constructor() {
        super()
        this.shadow = this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
        // Carrega els estils CSS
        const style = document.createElement('style')
        style.textContent = await fetch('/shadows/userLogin.css').then(r => r.text())
        this.shadow.appendChild(style)
    
        // Carrega els elements HTML
        const htmlContent = await fetch('/shadows/userLogin.html').then(r => r.text())

        // Converteix la cadena HTML en nodes utilitzant un DocumentFragment
        const template = document.createElement('template');
        template.innerHTML = htmlContent;
        
        // Clona i afegeix el contingut del template al shadow
        this.shadow.appendChild(template.content.cloneNode(true));

        // Definir els 'eventListeners' dels objectes (NO es pot fer des de l'HTML, al ser shadow no funciona)
        this.shadow.querySelector('#infoBtnLogOut').addEventListener('click', this.actionLogout.bind(this))
        this.shadow.querySelector('#loginBtnLogin').addEventListener('click', this.actionLogin.bind(this))
        this.shadow.querySelector('#loginShowSignUpForm').addEventListener('click', this.showSignUpForm.bind(this))
        this.shadow.querySelector('#signUpBtn').addEventListener('click', this.actionSignUp.bind(this))
        this.shadow.querySelector('#signUpShowLoginForm').addEventListener('click', this.showLoginForm.bind(this))

        // Automàticament, validar l'usuari per 'token' (si n'hi ha)
        await this.actionCheckUserByToken()
    } 

    hideAll () {
        // Amagar totes les vistes
        this.shadow.querySelector('#info').style.display = 'none'
        this.shadow.querySelector('#loginForm').style.display = 'none'
        this.shadow.querySelector('#signUpForm').style.display = 'none'
    }

    showInfo () {
        // Mostrar la vista de login, restaurar els estils
        this.hideAll()
        this.shadow.querySelector('#info').style.removeProperty('display')
        this.shadow.querySelector('#infoUser').style.removeProperty('display')
        this.shadow.querySelector('#infoLoading').style.removeProperty('display')
        this.shadow.querySelector('#infoBtnLogOut').style.removeProperty('display')

    }

    showLoginForm () {
        // Mostrar la vista de login, restaurar els estils
        this.hideAll()
        this.shadow.querySelector('#loginForm').style.removeProperty('display')
        this.shadow.querySelector('#loginError').style.removeProperty('display')
        this.shadow.querySelector('#loginLoading').style.removeProperty('display')
        this.shadow.querySelector('#loginButtons').style.removeProperty('display')
    }

    showSignUpForm () {
        // Mostrar la vista de sign up, restaurar els estils
        this.hideAll()
        this.shadow.querySelector('#signUpForm').style.removeProperty('display')
        this.shadow.querySelector('#signUpError').style.removeProperty('display')
        this.shadow.querySelector('#signUpLoading').style.removeProperty('display')
        this.shadow.querySelector('#signUpButtons').style.removeProperty('display')
    }

    async actionCheckUserByToken() {
        let refUserName = this.shadow.querySelector('#infoUser')
        let refLoading = this.shadow.querySelector('#infoLoading')
        let refButton = this.shadow.querySelector('#infoBtnLogOut')

        // Mostrar la vista
        this.showInfo()

        // Mostrar el loading i amagar el botó de logout
        refUserName.style.display = 'none'
        refLoading.style.display = 'block'
        refButton.style.display = 'none'

        // Identificar usuari si hi ha "token" al "LocalStorage"
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionCheckUserByToken',
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            if (resultData.result == 'OK') {
                // Guardar el nom d'usuari al LocalStorage i també mostrar-lo
                window.localStorage.setItem("userName", resultData.userName)
                refUserName.innerText = resultData.userName
                this.showInfo()
            } else {
                // Esborrar totes les dades del localStorage
                window.localStorage.clear() 
                refUserName.innerText = ""
                this.showLoginForm()
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.showLoginForm()
        }
    }

    async actionLogout() {
        let refUserName = this.shadow.querySelector('#infoUser')
        let refLoading = this.shadow.querySelector('#infoLoading')
        let refButton = this.shadow.querySelector('#infoBtnLogOut')

        // Mostrar la vista
        this.showInfo()

        // Mostrar el loading i amagar el botó de logout
        refUserName.style.display = 'block'
        refUserName.textContent = ""
        refLoading.style.display = 'block'
        refButton.style.display = 'none'

        // Identificar usuari si hi ha "token" al "LocalStorage"
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionLogout',
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            // Tant fa la resposta, esborrem les dades de sessió
            window.localStorage.clear()
            refUserName.innerText = resultData.userName
        } 
        this.showLoginForm()
    }

    async actionLogin() {
        let refInfoUser = this.shadow.querySelector('#infoUser')
        let refLoginUserName = this.shadow.querySelector('#loginUserName')
        let refPassword = this.shadow.querySelector('#loginPassword')
        let refError = this.shadow.querySelector('#loginError')
        let refLoading = this.shadow.querySelector('#loginLoading')
        let refButtons = this.shadow.querySelector('#loginButtons')

        // Mostrar la vista
        this.showLoginForm()

        // Mostrar el loading i amagar el botó de logout
        refLoading.style.display = 'block'
        refButtons.style.display = 'none'

        let requestData = {
            callType: 'actionLogin',
            userName: refLoginUserName.value,
            userPassword: refPassword.value
        }
        let resultData = await this.callServer(requestData)
        if (resultData.result == 'OK') {
            // Guardar el nom d'usuari al LocalStorage i també mostrar-lo
            window.localStorage.setItem("token", resultData.token)
            window.localStorage.setItem("userName", resultData.userName)
            refInfoUser.innerText = resultData.userName
            this.showInfo()
        } else {
            // Esborrar totes les dades del localStorage
            window.localStorage.clear() 
            refLoginUserName.innerText = ""
            
            // Mostrar l'error dos segons
            refError.style.display = 'block'
            refLoading.style.display = 'none'
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Esborrar el password
            refPassword.value = ""
            this.showLoginForm()
        }           
    }

    async actionSignUp() {
        let refInfoUser = this.shadow.querySelector('#infoUser')
        let refSignUpUserName = this.shadow.querySelector('#signUpUserName')
        let refPassword = this.shadow.querySelector('#signUpPassword')
        let refError = this.shadow.querySelector('#signUpError')
        let refLoading = this.shadow.querySelector('#signUpLoading')
        let refButtons = this.shadow.querySelector('#signUpButtons')

        // Mostrar la vista
        this.showSignUpForm()

        // Mostrar el loading i amagar el botó de logout
        refLoading.style.display = 'block'
        refButtons.style.display = 'none'

        let requestData = {
            callType: 'actionSignUp',
            userName: refSignUpUserName.value,
            userPassword: refPassword.value
        }
        let resultData = await this.callServer(requestData)
        if (resultData.result == 'OK') {
            // Guardar el nom d'usuari al LocalStorage i també mostrar-lo
            window.localStorage.setItem("token", resultData.token)
            window.localStorage.setItem("userName", resultData.userName)
            refInfoUser.innerText = resultData.userName
            this.showInfo()
        } else {
            // Esborrar totes les dades del localStorage
            window.localStorage.clear() 
            refSignUpUserName.innerText = ""
            
            // Mostrar l'error dos segons
            refError.style.display = 'block'
            refLoading.style.display = 'none'
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Esborrar el password
            refPassword.value = ""
            this.showSignUpForm()
        }           
    }

    async callServer(requestData) {
        // Fer la petició al servidor
        let resultData = null
        try {
            let result = await fetch('/ajaxCall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
            if (!result.ok) {
                throw new Error(`Error HTTP: ${result.status}`)
            }
            resultData = await result.json()
        } catch (e) {
            console.error('Error at "callServer":', e)
        }
        return resultData
    }
}

// Defineix l'element personalitzat
customElements.define('user-login', UserLogin)
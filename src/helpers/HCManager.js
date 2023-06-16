import fs, { appendFile } from 'fs';


class HCManager {

    #path
    #format

    #error


    constructor(path){
        this.#path = path;
        this.#format = 'utf-8';

        this.#error = null
    };

    #idGenerator = (array) => {
        if(!array || array.length <=0 || !array.length) {
            return 1
        } else {
            return array[array.length - 1].id + 1
        }
    };

    getAllClients = async () => {
        let fileExist = fs.existsSync(this.#path);
        if(!fileExist){
            this.#error = 'No se encontro el archivo de Clientes';
            console.log({error: this.#error});
            return {error: this.#error}
        };

        return JSON.parse( await fs.promises.readFile( this.#path, this.#format) );
    };

    #validateDNI = ({currentList, dni}) => {
        let list = currentList;
        let found = list.find(item => item.dni === dni)

        if(found){
            return found
        } else {
            return false
        }
        
    };

    addNewClient = async ({dni, primerNombre, otrosNombre, padreApellido, madreApellido, nacimiento}) => {
        let fileExist = fs.existsSync(this.#path);
        if(!fileExist) await fs.promises.writeFile(this.#path, JSON.stringify([]));

        let currentList = await this.getAllClients();
        if(currentList.error) return {error: currentList.error}; 


        let isRegistered
        if(currentList.length > 0){
            isRegistered = this.#validateDNI({currentList: currentList, dni: dni});
        } else {
            isRegistered = false
        }
        
        if(isRegistered){
            this.#error = 'YA existen algunos usuarios registrados con ese/esos apellidos';
            return {error: this.#error, users: isRegistered};
        };

        let id = this.#idGenerator(currentList);

        currentList.push({
            id: id,
            dni: dni,
            primerNombre: primerNombre,
            otrosNombre: otrosNombre,
            padreApellido: padreApellido,
            madreApellido: madreApellido,
            nacimiento: nacimiento,
            fechaRegistro: Date.now(),
            datosBiometricos: [],
            alertas: [],
            historiaClinica: {
                "problemas": [],
                "sesiones": []
            },
            finanzas: []
        });

        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
    };

    addDatosBiometricos = async ({cid, sexo, altura, peso, talla}) => {
        let currentList = this.getAllClients();
        currentList.error && {error: currentList.error}; 

        let clientIndex = currentList.findIndex(item => item.id === cid);
        if(clientIndex === -1){
            this.#error = `Usuario con ID: ${cid} no encontrado`;
            return {error: this.#error};
        }; 

        let IMC = peso / (altura * altura);

        currentList[clientIndex].datosBiometricos = [{
            sexo: sexo,
            altura: altura,
            peso: peso,
            talla: talla,
            imc: IMC
        }];

        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
    };

    addAlertas = async ({cid, alertas}) => {
        let currentList = await this.getAllClients();
        currentList.error && {error: currentList.error}; 

        let clientIndex = currentList.findIndex(item => item.id === cid);
        if(clientIndex === -1){
            this.#error = `Usuario con ID: ${cid} no encontrado`;
            console.log({error: this.#error})
            return {error: this.#error};
        }; 

        let addAlertas = []
        alertas.forEach((item) => {
            addAlertas.push(item)
        })
        currentList[clientIndex].alertas = addAlertas


        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
    };

    addProblemas = async ({cid, dxPrevio, dxPropio, descripcion}) => {
        let currentList = await this.getAllClients();
        currentList.error && {error: currentList.error}; 

        let clientIndex = currentList.findIndex(item => item.id === cid);
        if(clientIndex === -1){
            this.#error = `Usuario con ID: ${cid} no encontrado`;
            console.log({error: this.#error})
            return {error: this.#error};
        }; 
        let id = this.#idGenerator(currentList[clientIndex].historiaClinica.problemas);
        
        currentList[clientIndex].historiaClinica.problemas.push({
            id: id,
            fechaRegistro: Date.now(),
            estaActivo: true,
            dxPrevio: dxPrevio,
            dxPropio: dxPropio,
            descripcion: descripcion,
            multimedia: null
        });

        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
    };

    addSesion = async ({cid, idProblemas, descripcion}) => {
        let currentList = await this.getAllClients();
        currentList.error && {error: currentList.error}; 

        let clientIndex = currentList.findIndex(item => item.id === cid);
        if(clientIndex === -1){
            this.#error = `Usuario con ID: ${cid} no encontrado`;
            console.log({error: this.#error})
            return {error: this.#error};
        }; 
        let id = this.#idGenerator(currentList[clientIndex].historiaClinica.sesiones);
        
        currentList[clientIndex].historiaClinica.sesiones.push({
            id: id,
            fechaSesion: Date.now(),
            idProblemas: [...idProblemas],
            descripcion: descripcion
        });
        currentList[clientIndex].finanzas.sesionesAFavor = currentList[clientIndex].finanzas.sesionesAFavor - 1;

        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
    };

    addFinanzas = async ({cid, pagado, sesionesCompradas}) => {
        let currentList = await this.getAllClients();
        currentList.error && {error: currentList.error}; 

        let clientIndex = currentList.findIndex(item => item.id === cid);
        if(clientIndex === -1){
            this.#error = `Usuario con ID: ${cid} no encontrado`;
            console.log({error: this.#error})
            return {error: this.#error};
        };

        currentList[clientIndex].finanzas.pagos.push(
            {
                pagado: pagado, 
                sesionesCompradas: sesionesCompradas,
                fechaPago: Date.now()
            }
        );
        currentList[clientIndex].finanzas.sesionesAFavor = currentList[clientIndex].finanzas.sesionesAFavor + sesionesCompradas;
        
        return await fs.promises.writeFile(this.#path, JSON.stringify(currentList, null, '\t'));
        
    }
};

const HCmanager = new HCManager('./src/data/HC.json');

// HCmanager.addNewClient({
//     dni: 123123,
//     primerNombre: 'Joaquin', 
//     otrosNombre: 'Federico', 
//     padreApellido: 'Rodriguez', 
//     madreApellido: 'Vilar', 
//     nacimiento: '1994-01-18'
// });


// HCmanager.addAlertas({
//     cid: 1, alertas: ["espondilolistesis", "escoliosis", "Fisura en el arco vertebral"]
// })

// HCmanager.addProblemas({
//     cid: 1, dxPrevio: 'Fractura de cadera',
//      dxPropio: 'Fractura de cadera', 
//      descripcion: 'Paciente con una fractura de cadera que presenta dolor en la zona lumbar que se irradia a la pierna.'
// })


// HCmanager.addSesion({
//     cid: 1, 
//     idProblemas: [1, 2], 
//     descripcion: 'Se realizo magnetoterapia con electroterapia para tratar el dolor y relajar tejidos. Luego se realizaron abordajes de OSteopatia joyas'
// })

// HCmanager.addFinanzas({
//     cid: 1, 
//     pagado: 550, 
//     sesionesCompradas: 10
// })
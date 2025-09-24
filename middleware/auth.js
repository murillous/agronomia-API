/**
 *Valida se todos os campos obrigatórios são válidos
 *  @param {Object}
 * @returns {Object}
*/

function validateRequiredFields(data){
    const requiredFields = [
        "Temperatura",
        "Umidade",
        "PluviometroH",
        "PluviometroD",
        "Pressão",
        "IdEstacao",
        "ts"
    ];

    for(const field of requiredFields){
        if(data[field] == undefined || data[field] == null){
            return{
                isValid: false,
                missingField: field,
                error: `Campo obrigatório ausente: ${field}`
            };
        }
        return {isValid: true};
    }
}
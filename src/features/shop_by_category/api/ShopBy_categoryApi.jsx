import client from "../../../lib/ApiClient"


export const ShopBy_categoryGet = async () =>{
    try{
        const response = await client.get('home/categories/')
        return response.data
    }
    catch(error){
        console.log(error);
        
    }
}


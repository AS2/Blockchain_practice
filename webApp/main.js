serverUrl = "https://zppns2yfgvtj.usemoralis.com:2053/server"; //Server url from moralis.io
appId =  "iHe5t2vJJ0dTr69lkte9jkseJWw7NR23fRGPQOqZ"; // Application id from moralis.io
Moralis.start({ serverUrl, appId});

const CONTRACT_ADDRESS = "0xc62a9f7281953857f48e6da588a61f51552260a6"
let currentUser;

function fetchNFTMetadata(NFTs) {
    let promises = [];

    for (let i = 0; i < NFTs.length; i++) {
        let nft = NFTs[i];
        let id = nft.token_id;
        // Call Moralis Cloud function -> static JSON file
        promises.push(fetch("https://zppns2yfgvtj.usemoralis.com:2053/server/functions/getNFT?_ApplicationId=iHe5t2vJJ0dTr69lkte9jkseJWw7NR23fRGPQOqZ&nftId=" + id)
        .then(res => res.json())
        .then(res => JSON.parse(res.result))
        .then(res => {nft.metadata = res})
        .then(res => {
            const options = {address: CONTRACT_ADDRESS, token_id: id, chain: "rinkeby"};
            return Moralis.Web3API.token.getTokenIdOwners(options);
        })
        .then( (res) => {
            nft.owners  = [];
            res.result.forEach(element => {
                nft.owners.push(element.ownerOf);
            })
            return nft;
        }))
    }
    return Promise.all(promises);
}

function drawInventory(NFTs, ownerData) {
    const parent = document.getElementById("app");

    for (let i = 0; i < NFTs.length; i++) {
        const nft = NFTs[i];
         let htmlString = `
            <div class="card">
                <img src="${nft.metadata.image}" class="card-img-top" alt="...">
                <div class="card-body">
                    <h5 class="card-title">${nft.metadata.name}</h5>
                    <p class="card-text">${nft.metadata.description}</p>
                    <p class="card-text">Total in circulation: ${nft.amount}</p>
                    <p class="card-text">Count of happy customers who bought this: ${nft.owners.length}</p>
                    <p class="card-text">Your balance: ${ownerData[nft.token_id]}</p>
                    <a href="/mint.html?nftId=${nft.token_id}" class="btn btn-primary">MINT DAT</a>
                    <a href="/transfer.html?nftId=${nft.token_id}" class="btn btn-primary">TRANSFER DAT</a>
                </div>
            </div>
         `

         let col = document.createElement("div");
         col.className = "col col-md-3"
         col.innerHTML = htmlString;
         parent.appendChild(col);
    }
}

async function getOwnerData() {
    let accounts = currentUser.get("accounts");
    const options = {chain: "rinkeby", address: accounts[0], token_address: CONTRACT_ADDRESS};
    return Moralis.Web3API.account.getNFTsForContract(options).then((data) => {
        let result = data.result.reduce((object, currentElement) => {
            object[currentElement.token_id] = currentElement.amount;
            return object;
        }, {})
        //console.log(result);
        return result
    });
}

async function login() {
    currentUser = Moralis.User.current();
    if (!currentUser) {
        try {
            currentUser = await Moralis.Web3.authenticate();
            console.log(user);
            alert("User logged in")
        } catch (error) {
            console.log(error);
        }
    }

    const options = {address: CONTRACT_ADDRESS, chain: "rinkeby"}
    let NFTs = await Moralis.Web3API.token.getAllTokenIds(options);
    let NFTWithMetadata = await fetchNFTMetadata(NFTs.result);
    let ownerData = await getOwnerData();

    //console.log(NFTWithMetadata);
    drawInventory(NFTWithMetadata, ownerData);
}

login();
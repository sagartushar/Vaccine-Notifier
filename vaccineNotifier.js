require('dotenv').config()
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');
const notifier = require('./notifier');
const STATE = process.env.STATE
const DISTRICT = process.env.DISTRICT

const PINCODE = process.env.PINCODE
const EMAIL = process.env.EMAIL
const AGE = process.env.AGE

async function main(){
    try {
        notifyMe('{}');
        cron.schedule('*/30 * * * * *', async () => {
            console.log("start ho gya");
             await checkAvailability();
        });
    } catch (e) {
        console.log('an error occured: ' + JSON.stringify(e, null, 2));
        throw e;
    }
}

async function checkAvailability() {
    let stateIdArray = [140,141,142,143,144,145,146,147,148,149,150];
    let datesArray = await fetchNext10Days();
    datesArray.forEach(date => {
        // stateIdArray.forEach(stateId=>{
            // console.log("Date k bd ",date);
            getSlotsForDate(date,142);
        // });
    })
}

function getSlotsForDate(DATE,stateId) {
    let config = {
        method: 'get',
        url: 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=' +stateId  + '&date=' + DATE,
        headers: {
            'accept': 'application/json',
            'Accept-Language': 'hi_IN',
            'Host': 'cdn-api.co-vin.in',
            'User-Agent': 'PostmanRuntime/7.26.8'
        }
    };

    axios(config)
        .then(function (slots) {
            let sessions = slots.data.sessions;
            let validSlots = sessions.filter(slot => slot.min_age_limit <= AGE && slot.available_capacity_dose1 > 0 && slot.fee == 0);
            console.log({date:DATE, validSlots: validSlots.length})
            if(validSlots.length > 0) {
                notifyMe(validSlots);
                // let slotDetails = JSON.stringify(validSlots, null, '\t');
                // console.log(slotDetails);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function

notifyMe(validSlots){
    
    let slotDetails = JSON.stringify(validSlots, null, '\t');
    console.log(slotDetails);
    notifier.sendEmail(EMAIL, 'VACCINE AVAILABLE', slotDetails, (err, result) => {
        if(err) {
            console.error({err});
        }
    })
};

async function fetchNext10Days(){
    let dates = [];
    let today = moment();
    for(let i = 0 ; i < 5 ; i ++ ){
        let dateString = today.format('DD-MM-YYYY')
        // console.log(dateString);
        dates.push(dateString);
        today.add(1, 'day');
    }
    return dates;
}


main()
    .then(() => {console.log('Vaccine availability checker started.');});
   
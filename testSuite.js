// Run this test suite using extensions like https://chrome.google.com/webstore/detail/custom-javascript-for-web/ddbjnfjiigjmcpcpkmhogomapikjbjdk

let meetURL = 'https://meet.google.com/sgk-jtrv-vcb';

window.addEventListener('focus', function () {
    window.location.href = meetURL;
})

//Tests
window.addEventListener("load", async function () {
    let testCase = localStorage.getItem('testCase');
    let delayBefore = 4000;

    if (testCase == 1) {
        // 10 sec meeting
        await clicker(delayBefore, 10000)
        setTimeout(function () {
            localStorage.setItem('testCase', 2)
            window.location.href = meetURL;
        }, delayBefore + 10000 + 1000);
    }

    if (testCase == 2) {
        // 1 min meeting
        await clicker(delayBefore, 60000)
        setTimeout(function () {
            localStorage.setItem('testCase', 3)
            window.location.href = meetURL;
        }, delayBefore + 60000 + 1000);
    }

    if (testCase == 3) {
        // 5 min meeting
        await clicker(delayBefore, 300000)
        setTimeout(function () {
            localStorage.setItem('testCase', 4)
            window.location.href = meetURL;
        }, delayBefore + 300000 + 1000);
    }

    if (testCase == 4) {
        // 10 min meeting
        await clicker(delayBefore, 600000)
        setTimeout(function () {
            localStorage.setItem('testCase', 5)
            window.location.href = meetURL;
        }, delayBefore + 600000 + 1000);
    }

    if (testCase == 5) {
        //30 min meeting
        await clicker(delayBefore, 1800000)
        setTimeout(function () {
            localStorage.setItem('testCase', '1_t')
            window.location.href = meetURL;
        }, delayBefore + 1800000 + 1000);
    }

    // t indicates tab close test cases
    if (testCase == '1_t') {
        // 10 sec meeting
        localStorage.setItem('testCase', '1_tt')
        window.open(meetURL, '_blank').focus();
        // 10 sec
    }

    if (testCase == '1_tt') {
        localStorage.setItem('testCase', undefined)
        // 10 sec meeting
        await clicker(delayBefore, 10000)
        setTimeout(function () {
            localStorage.setItem('testCase', '2_t')
            window.close();
        }, delayBefore + 10000 + 1000);
    }

    if (testCase == '2_t') {
        localStorage.setItem('testCase', '2_tt')
        window.open(meetURL, '_blank').focus();
        // 1 min meeting
    }

    if (testCase == '2_tt') {
        localStorage.setItem('testCase', undefined)
        // 1 min meeting
        await clicker(delayBefore, 60000)
        setTimeout(function () {
            localStorage.setItem('testCase', '3_t')
            window.close();
        }, delayBefore + 60000 + 1000);
    }

    if (testCase == '3_t') {
        localStorage.setItem('testCase', '3_tt')
        window.open(meetURL, '_blank').focus();
        // 5 min meeting
    }

    if (testCase == '3_tt') {
        localStorage.setItem('testCase', undefined)
        // 5 min meeting
        await clicker(delayBefore, 300000)
        setTimeout(function () {
            localStorage.setItem('testCase', '4_t')
            window.close();
        }, delayBefore + 300000 + 1000);
    }

    if (testCase == '4_t') {
        localStorage.setItem('testCase', '4_tt')
        window.open(meetURL, '_blank').focus();
        // 10 min meeting
    }

    if (testCase == '4_tt') {
        localStorage.setItem('testCase', undefined)
        // 10 min meeting
        await clicker(delayBefore, 600000)
        setTimeout(function () {
            localStorage.setItem('testCase', '5_t')
            window.close();
        }, delayBefore + 600000 + 1000);
    }

    if (testCase == '5_t') {
        localStorage.setItem('testCase', '5_tt')
        window.open(meetURL, '_blank').focus();
        // 30 min meeting
    }

    if (testCase == '5_tt') {
        localStorage.setItem('testCase', undefined)
        // 30 min meeting
        await clicker(delayBefore, 1800000)
        setTimeout(function () {
            localStorage.setItem('testCase', undefined)
            window.close();
        }, delayBefore + 1800000 + 1000);
    }

    else if (testCase == undefined) {
        return;
    }
})


async function clicker(delayBefore, delayMeeting) {
    setTimeout(function () {
        contains("div", "Join now")[14].firstChild.click()
    }, delayBefore);

    setTimeout(function () {
        contains("i", "call_end")[0].parentElement.click();
    }, delayBefore + delayMeeting);

    setTimeout(function () {
        contains("span", "Just leave the call")[0].parentElement.click();
    }, delayBefore + delayMeeting + 200);

    setTimeout(function () {
        window.location.href = meetURL;
        return new Promise(resolve => { resolve() });
    }, delayBefore + delayMeeting + 3000);
}

function contains(selector, text) {
    var elements = document.querySelectorAll(selector);
    return Array.prototype.filter.call(elements, function (element) {
        return RegExp(text).test(element.textContent);
    });
}
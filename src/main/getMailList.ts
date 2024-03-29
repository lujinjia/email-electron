const Imap = require('imap')
const { MailParser } =require('mailparser')

import { server }  from './socketServer'

let mailList: any = []
const imap = new Imap({
  user: '924515022@qq.com',
  password: 'syhlbuoajobdbfif',
  host: 'imap.qq.com',
  port: 993,
  tls: true
})

let mailMap = {
  searchCount: 0,
  count: 0
}

const sysnMail = (type, data) => {
  server.emitData(type, data)
}

const getMail = () => {
  const lastDate = new Date('2024-03-13 00:00:00').toLocaleString()
  imap.openBox('INBOX', true, () => {
    imap.search( ['ALL', ['SINCE', lastDate] ], function(err, searchResults) {
      if (err) throw err;
      // searchResults是一个数组，其中包含了所有邮件的UIDs或序列号
      searchResults = searchResults.reverse()
      mailMap.searchCount = searchResults.length;
      searchResults.forEach((uid) => {
        // mailMap[uid] = {}
      })
      // 使用fetch命令和UIDs数组来获取所有邮件
      var f = imap.fetch(searchResults, {
        bodies: '', // 获取邮件头和正文
        struct: true // 获取邮件结构
      })

      handleResults(f)
    })
  })
}

const handleResults = (f) => {
  f.on('message', (message, seqno) => {
    mailMap[seqno] = {}

    console.log('Message #%d', seqno);
    const mailparser = new MailParser();
    message.on('body', (stream) => {
      const info: any = mailMap[seqno];
      stream.pipe(mailparser);

      mailparser.on('headers', (headers) => {
        if (headers.get('subject')) {
          info.theme = headers.get('subject');
        }
        if (headers.get('from')?.value) {
          info.form = headers.get('from').value[0]?.address;
          info.mailName = headers.get('from').value[0]?.name;
        }
        if (headers.get('to')?.value) {
          info.to = headers.get('to').value[0]?.address;
        }
        if (headers.get('date')) {
          info.datatime = headers.get('date').toLocaleString();
        }
        if (headers.get('message-id')) {
          info.id = headers.get('message-id')
        }
      })

      mailparser.on('data', (data) => {
        if (data.type === 'text') {
          info.html = data.html || data.textAsHtml;
          info.text = data.text;
        }
        if (data.type === 'attachment') {
            // const filePath = path.join(__dirname, 'files', data.filename);
            // const ws = fs.createWriteStream(filePath);
            // data.content.pipe(ws);
        }
        mailMap.count++
        if (mailMap.count >= mailMap.searchCount) {
          console.log(mailMap)
          mailList = []
          for (let i in mailMap) {
            if (!['searchCount', 'count'].includes(i)) {
              mailList.unshift(mailMap[i])
            }
          }

          sysnMail('MAIL_INIT', mailList)
        }
      })

      mailparser.on('error', (err) => {
        console.log('error', err)
      })
    })
  })

  f.once('error', function(err) {
    console.log('Fetch error: ' + err);
  });
  f.once('end', function() {
    console.log('Done fetching all messages!');
  });

}

imap.once('ready', () => {
  // getMail('1:20')
})

imap.connect()

export function getMailList() {
  mailList = []
  imap.once('ready', () => {
    getMail('1:20')
  })
  imap.connect()
}

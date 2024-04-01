<template>
  <div class="common-layout">
    <el-container style="height: 100%;">
      <el-header>
        <el-button @click="syncMailList">收信</el-button>
        <el-button @click="openSendWin">发信</el-button>
        <el-button @click="replyMail">回复</el-button>
        <el-button @click="transferMail">转发</el-button>
      </el-header>
      <el-container>
        <el-aside width="130px">
          <el-tree
            style="max-width: 600px"
            :data="treeData"
            :props="defaultProps"
            @node-click="handleNodeClick"
          />
        </el-aside>
        <el-aside width="210px">
          <div class="flex flex-wrap gap-4">
            <el-card style="width: 100%" shadow="always" v-for="mail in mailList"
            :class="{
              isSelected: mail.id === selectedID
             }">
             <span @click="getMailDetail(mail)">
              <p>{{  mail.mailName }}</p>
              <p>{{  mail.theme }}</p>
              <p>{{  mail.datatime }}</p>
            </span>
            </el-card>
          </div>
        </el-aside>
        <el-container>
          <el-main>
            <div v-html="mailDetail" style="width: 100%; height: 100%; overflow: auto;">
            </div>
          </el-main>
          <!-- <el-footer>搞点AI功能</el-footer> -->
        </el-container>
      </el-container>
    </el-container>
    <el-dialog v-model="dialogFormVisible" destroy-on-close title="发送邮件" width="800" :close-on-press-escape="false" :close-on-click-modal="false">
      <el-form :model="form">
        <el-form-item label="收件人">
          <el-input v-model="form.to"/>
        </el-form-item>

        <el-form-item label="主题">
          <el-input v-model="form.subject"/>
        </el-form-item>
      </el-form>
      <div id="editor">
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button @click="sendMail" type="primary">发送</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { io } from 'socket.io-client'

const socket = io('ws://localhost:3000')

let editor

interface Tree {
  label: string
  type: string
  children?: Tree[]
}

const handleNodeClick = (data: Tree) => {
  console.log(data)
}

//收件箱，已发送，草稿箱，星标邮件
const treeData: Tree[] = [
  {
    label: '账号名',
    type: 'ROOT',
    children: [
      {
        label: '收件箱',
        type: 'INBOX',
        children: [],
      },
      {
        label: '已发送',
        type: 'SEND',
        children: [],
      },
      {
        label: '草稿箱',
        type: 'draft',
        children: [],
      },
      {
        label: '星标邮件',
        type: 'star',
        children: [],
      },
    ],
  }]

// 初始化邮件列表
socket.on('MAIL_INIT', (res) => {
  mailList.value = res
})

// 新邮件
socket.on('MAIL_NEW', (res) => {
  mailList.value = res
})

// 收信
const syncMailList = () => {
  window.api.getMailList()
}

setInterval(() => {
  // syncMailList()
}, 50000)

let selectedID = ref('')
let mailList:any = ref([])
let mailDetail = ref('')

const dialogFormVisible = ref(false)
const form = reactive({
  to: '',
  subject: '',
  text: ''
})

watch(mailList, (newMaiList) => {
  // mailList.value = newMaiList
})

const getMailDetail = (mail) => {
  mailDetail.value = mail.html
  selectedID.value = mail.id
}

const getMail = (id) => {
  return mailList.value.find(item => item.id === id.value)
}

const openSendWin = (email) => {
  dialogFormVisible.value = true
  editor = $("#editor").summernote({
    height: 200,   //set editable area's height
    minHeight: 200,             // set minimum height of editor
    maxHeight: 400,
    codemirror: { // codemirror options
      theme: 'monokai'
    }
  });
  nextTick(() => {
    let HTMLstring = email.html
    const sendName = email.to
    const mailName = email.mailName
    const datetime = email.datatime
    const subject = email.theme
    const themeBlock = `
    <div style="position: relative;">
      <div style="font-size: 12px;font-family: Arial Narrow;padding:2px 0 2px 0;">
        ------------------ 原始邮件 ------------------
      </div>
      <div style="font-size: 12px;background:#efefef;padding:8px;">
        <div>
          <b>发件人:</b>
          "${mailName}" &lt;<a href="mailto:${email.form}" rel="noopener"
            target="_blank">${email.form}</a>&gt;;
          </div>
        <div>
          <b>发送时间:</b>
          &nbsp;${datetime}
        </div>
        <div>
          <b>收件人:</b>
          &nbsp;"${sendName}"&lt;<a href="mailto:${sendName}" rel="noopener"
            target="_blank">${sendName}</a>&gt;;<wbr>
        </div>
        <div></div>
        <div>
          <b>主题:</b>&nbsp;${subject}
        </div>
      </div>
      <div><br></div>
    </div>
    `
    HTMLstring = HTMLstring ? themeBlock + HTMLstring : HTMLstring
    $('#editor').summernote('pasteHTML', HTMLstring);
  })
}

const sendMail = async () => {
  const res = await window.api.sendMail({
    from: '924515022@qq.com',
    to: form.to,
    subject: form.subject,
    text: $('#editor').summernote('code')
  })
  if (res) {
    ElMessage.success('发送成功')
    dialogFormVisible.value = false
    syncMailList()
  } else {
    ElMessage.error('发送失败')
  }
}

// 回复邮件
const replyMail = () => {
  const selectedMail = getMail(selectedID)
  // 回复邮件，收件人，主题以及编辑器的内容（需要收信人块）
  form.to = selectedMail.form
  form.subject = `回复：${selectedMail.theme}`
  openSendWin(selectedMail)
}

// 转发邮件
const transferMail = () => {
  const selectedMail = getMail(selectedID)
  // 回复邮件，收件人，主题以及编辑器的内容（需要收信人块）
  form.to = ''
  form.subject = `转发：${selectedMail.theme}`
  openSendWin(selectedMail)
}
</script>

<style scoped>
  .common-layout .el-header {
      background-color: var(--el-color-primary-light-7);
      color: var(--el-text-color-primary);
      height: 10vh;
      padding: 20px;
  }

  .common-layout .el-aside {
    color: var(--el-text-color-primary);
    height: 90vh;
  }

  .common-layout .el-main {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-text-color-primary);
    height: 90vh;
  }

  .common-layout .el-footer {
    background-color: var(--el-color-primary-light-7);
    color: var(--el-text-color-primary);
    height: 10vh;
  }

  .isSelected {
    background-color: beige;
  }

  #editor {
    width: 100%;
    border: 1px solid #ccc;
  }
</style>

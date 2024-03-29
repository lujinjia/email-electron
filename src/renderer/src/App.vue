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

        <el-aside width="230px">
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
    <el-dialog v-model="dialogFormVisible" title="发送邮件" width="500">
      <el-form :model="form">
        <el-form-item label="收件人">
          <el-input v-model="form.to"/>
        </el-form-item>

        <el-form-item label="主题">
          <el-input v-model="form.subject"/>
        </el-form-item>
      </el-form>
      <div class="editor" id="editor">
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
import { ref, watch, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { io } from 'socket.io-client'

import Quill from 'quill';


const socket = io('ws://localhost:3000')

let quill

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

const openSendWin = () => {
  dialogFormVisible.value = true
  nextTick(() => {
    const options = {
      debug: 'info',
      modules: {
        toolbar: false,
      },
      placeholder: '请输入邮件内容（支持富文本)...',
      theme: 'snow'
    };
    quill = new Quill('#editor', options);
  })
}

const sendMail = async () => {
  const res = await window.api.sendMail({
    from: '924515022@qq.com',
    to: form.to,
    subject: form.subject,
    text: quill.getSemanticHTML()
  })
  if (res) {
    ElMessage.success('发送成功')
    dialogFormVisible.value = false
  } else {
    ElMessage.error('发送失败')
  }
}

// 回复邮件
const replyMail = () => {

}

// 转发邮件
const transferMail = () => {

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
    background-color: var(--el-color-primary-light-8);
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

  .editor {
    width: 100%;
    height: 200px;
    border: 1px solid #ccc;
  }
</style>

<template>
  <router-view />
</template>

<script setup>
// Root component hosting the router outlet
</script>

<style>
/* Global element plus style tweaks for a premium look */
.el-button {
  font-family: inherit;
  border-radius: 8px !important;
}
.el-card {
  border-radius: 12px !important;
  border-color: #f1f5f9 !important;
}
.el-dialog {
  border-radius: 16px !important;
}
.el-table {
  border-radius: 12px !important;
  overflow: hidden;
}
.el-input__wrapper {
  border-radius: 8px !important;
}
.el-select__wrapper {
  border-radius: 8px !important;
}
</style>

<template>
  <div class="admin-post-page">
    <section class="update-form">
      <AdminPostForm :post="loadedPost" @submit="onSubmitted"/>
    </section>
  </div>
</template>

<script>
  import AdminPostForm from '@/components/Admin/AdminPostForm'

  export default {
    layout: 'admin',
    middleware: ['check-auth','auth'],
    components: {
      AdminPostForm
    },
    async asyncData({app, params}) {
      try {
        let data = await app.$axios
          .$get(`/posts/${params.postId}.json`)
        return {
          loadedPost: { ...data, id: params.postId }
        }
      } catch (e) {
        console.error(e.message)
      }
    },
    methods: {
      async onSubmitted(editedPost) {
        try {
          await this.$store.dispatch('editedPost', editedPost)
          this.$router.push('/admin')
        } catch (e) {
          console.error(e.message)
        }
      }
    }
  }
</script>

<style scoped>
  .update-form {
    width: 90%;
    margin: 20px auto;
  }
  @media (min-width: 768px) {
    .update-form {
      width: 500px;
    }
  }
</style>

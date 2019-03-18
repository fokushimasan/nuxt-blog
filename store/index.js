import Vuex from 'vuex'
import Cookie from 'js-cookie'

const createStore = () => {
  return new Vuex.Store({
    state: {
      loadedPosts: [],
      token: null
    },
    mutations: {
      setPosts(state, posts) {
        state.loadedPosts = posts
      },
      addPost(state, post) {
        state.loadedPosts.push(post)
      },
      editPost(state, editedPost) {
        const postIndex = state.loadedPosts.findIndex(
          post => post.id === editedPost.id
        )
        state.loadedPosts[postIndex] = editedPost
      },
      setToken(state, token) {
        state.token = token
      },
      clearToken(state) {
        state.token = null
      }
    },
    actions: {
      async nuxtServerInit(vuexContext, context) {
        try {
          const data = await context.app.$axios.$get(`/posts.json`)
          const postArray = []
          for (let key in data) {
            postArray.push({...data[key], id: key})
          }
          vuexContext.commit('setPosts', postArray)
        } catch (e) {
          console.error(e.message)
        }
      },
      async addPost(vuexContent, postData) {
        try {
          const createdPost = {
            ...postData,
            updatedDate: new Date()
          }
          let data = await this.$axios.$post(`/posts.json?auth=${vuexContent.state.token}`, createdPost)
          vuexContent.commit('addPost', {...createdPost, id: data.name})
        } catch (e) {
          console.error(e.message)
        }
      },
      async editedPost(vuexContent, editedPost) {
        try {
          let data = await this.$axios.$put(
            `/posts/${editedPost.id}.json?auth=${vuexContent.state.token}`,
            editedPost
          )
          vuexContent.commit('editPost', editedPost)
          return data
        } catch (e) {
          console.error(e.message)
        }
      },
      setPosts({commit}, posts) {
        commit('setPosts', posts)
      },
      async authenticateUser(vuexContext, authData) {
        let authUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key='+process.env.fbAPIKey
        if (!authData.isLogin) {
          authUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key='+ process.env.fbAPIKey
        }
        try {
          let result = await this.$axios.$post(
            authUrl,
            {
              email: authData.email,
              password: authData.password,
              returnSecureToken: true
            }
          )
          vuexContext.commit('setToken', result.idToken)
          localStorage.setItem('token', result.idToken)
          localStorage.setItem('tokenExpiration', new Date().getTime()+ Number.parseInt(result.expiresIn) * 1000)
          Cookie.set('jwt', result.idToken)
          Cookie.set('expirationDate', new Date().getTime()+ Number.parseInt(result.expiresIn) * 1000)
        } catch (e) {
          console.error(e.message)
        }
      },
      initAuth(vuexContext, req) {
        let token
        let expirationDate
        if (req) {
          if (!req.headers.cookie) {
            return
          }
          const jwtCookie = req.headers.cookie
            .split(';')
            .find(c => c.trim().startsWith('jwt='))
          if (!jwtCookie) {
            return
          }
          token = jwtCookie.split('=')[1]
          expirationDate = req.headers.cookie
            .split(';')
            .find(c => c.trim().startsWith('expirationDate='))
            .split('=')[1]
        } else {
          token = localStorage.getItem('token')
          expirationDate = localStorage.getItem('tokenExpiration')
        }
        if (new Date().getTime() > +expirationDate || !token) {
          vuexContext.dispatch('logout')
          return
        }
        vuexContext.commit('setToken', token)
      },
      logout(vuexContext) {
        vuexContext.commit('clearToken')
        Cookie.remove('jwt')
        Cookie.remove('expirationDate')
        if (process.client) {
          localStorage.removeItem('token')
          localStorage.removeItem('tokenExpiration')
        }
      }
    },
    getters: {
      loadedPosts(state) {
        return state.loadedPosts
      },
      isAuthenticated({token}) {
        return token != null
      }
    }
  })
}

export default createStore

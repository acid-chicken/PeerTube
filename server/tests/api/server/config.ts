/* tslint:disable:no-unused-expression */

import 'mocha'
import * as chai from 'chai'
import { About } from '../../../../shared/models/server/about.model'
import { CustomConfig } from '../../../../shared/models/server/custom-config.model'
import {
  deleteCustomConfig,
  getAbout,
  killallServers,
  reRunServer,
  flushTests,
  getConfig,
  getCustomConfig,
  registerUser,
  runServer,
  setAccessTokensToServers,
  updateCustomConfig
} from '../../../../shared/utils'
import { ServerConfig } from '../../../../shared/models'

const expect = chai.expect

function checkInitialConfig (data: CustomConfig) {
  expect(data.instance.name).to.equal('PeerTube')
  expect(data.instance.shortDescription).to.equal(
    'PeerTube, a federated (ActivityPub) video streaming platform using P2P (BitTorrent) directly in the web browser ' +
    'with WebTorrent and Angular.'
  )
  expect(data.instance.description).to.equal('Welcome to this PeerTube instance!')
  expect(data.instance.terms).to.equal('No terms for now.')
  expect(data.instance.defaultClientRoute).to.equal('/videos/trending')
  expect(data.instance.isNSFW).to.be.false
  expect(data.instance.defaultNSFWPolicy).to.equal('display')
  expect(data.instance.customizations.css).to.be.empty
  expect(data.instance.customizations.javascript).to.be.empty

  expect(data.services.twitter.username).to.equal('@Chocobozzz')
  expect(data.services.twitter.whitelisted).to.be.false

  expect(data.cache.previews.size).to.equal(1)
  expect(data.cache.captions.size).to.equal(1)

  expect(data.signup.enabled).to.be.true
  expect(data.signup.limit).to.equal(4)
  expect(data.signup.requiresEmailVerification).to.be.false

  expect(data.admin.email).to.equal('admin1@example.com')
  expect(data.contactForm.enabled).to.be.true

  expect(data.user.videoQuota).to.equal(5242880)
  expect(data.user.videoQuotaDaily).to.equal(-1)
  expect(data.transcoding.enabled).to.be.false
  expect(data.transcoding.allowAdditionalExtensions).to.be.false
  expect(data.transcoding.threads).to.equal(2)
  expect(data.transcoding.resolutions['240p']).to.be.true
  expect(data.transcoding.resolutions['360p']).to.be.true
  expect(data.transcoding.resolutions['480p']).to.be.true
  expect(data.transcoding.resolutions['720p']).to.be.true
  expect(data.transcoding.resolutions['1080p']).to.be.true
  expect(data.transcoding.hls.enabled).to.be.true

  expect(data.import.videos.http.enabled).to.be.true
  expect(data.import.videos.torrent.enabled).to.be.true
}

function checkUpdatedConfig (data: CustomConfig) {
  expect(data.instance.name).to.equal('PeerTube updated')
  expect(data.instance.shortDescription).to.equal('my short description')
  expect(data.instance.description).to.equal('my super description')
  expect(data.instance.terms).to.equal('my super terms')
  expect(data.instance.defaultClientRoute).to.equal('/videos/recently-added')
  expect(data.instance.isNSFW).to.be.true
  expect(data.instance.defaultNSFWPolicy).to.equal('blur')
  expect(data.instance.customizations.javascript).to.equal('alert("coucou")')
  expect(data.instance.customizations.css).to.equal('body { background-color: red; }')

  expect(data.services.twitter.username).to.equal('@Kuja')
  expect(data.services.twitter.whitelisted).to.be.true

  expect(data.cache.previews.size).to.equal(2)
  expect(data.cache.captions.size).to.equal(3)

  expect(data.signup.enabled).to.be.false
  expect(data.signup.limit).to.equal(5)
  expect(data.signup.requiresEmailVerification).to.be.false

  expect(data.admin.email).to.equal('superadmin1@example.com')
  expect(data.contactForm.enabled).to.be.false

  expect(data.user.videoQuota).to.equal(5242881)
  expect(data.user.videoQuotaDaily).to.equal(318742)

  expect(data.transcoding.enabled).to.be.true
  expect(data.transcoding.threads).to.equal(1)
  expect(data.transcoding.allowAdditionalExtensions).to.be.true
  expect(data.transcoding.resolutions['240p']).to.be.false
  expect(data.transcoding.resolutions['360p']).to.be.true
  expect(data.transcoding.resolutions['480p']).to.be.true
  expect(data.transcoding.resolutions['720p']).to.be.false
  expect(data.transcoding.resolutions['1080p']).to.be.false
  expect(data.transcoding.hls.enabled).to.be.false

  expect(data.import.videos.http.enabled).to.be.false
  expect(data.import.videos.torrent.enabled).to.be.false
}

describe('Test config', function () {
  let server = null

  before(async function () {
    this.timeout(30000)

    await flushTests()
    server = await runServer(1)
    await setAccessTokensToServers([ server ])
  })

  it('Should have a correct config on a server with registration enabled', async function () {
    const res = await getConfig(server.url)
    const data: ServerConfig = res.body

    expect(data.signup.allowed).to.be.true
  })

  it('Should have a correct config on a server with registration enabled and a users limit', async function () {
    this.timeout(5000)

    await Promise.all([
      registerUser(server.url, 'user1', 'super password'),
      registerUser(server.url, 'user2', 'super password'),
      registerUser(server.url, 'user3', 'super password')
    ])

    const res = await getConfig(server.url)
    const data: ServerConfig = res.body

    expect(data.signup.allowed).to.be.false
  })

  it('Should have the correct video allowed extensions', async function () {
    const res = await getConfig(server.url)
    const data: ServerConfig = res.body

    expect(data.video.file.extensions).to.have.lengthOf(3)
    expect(data.video.file.extensions).to.contain('.mp4')
    expect(data.video.file.extensions).to.contain('.webm')
    expect(data.video.file.extensions).to.contain('.ogv')

    expect(data.contactForm.enabled).to.be.true
  })

  it('Should get the customized configuration', async function () {
    const res = await getCustomConfig(server.url, server.accessToken)
    const data = res.body as CustomConfig

    checkInitialConfig(data)
  })

  it('Should update the customized configuration', async function () {
    const newCustomConfig: CustomConfig = {
      instance: {
        name: 'PeerTube updated',
        shortDescription: 'my short description',
        description: 'my super description',
        terms: 'my super terms',
        defaultClientRoute: '/videos/recently-added',
        isNSFW: true,
        defaultNSFWPolicy: 'blur' as 'blur',
        customizations: {
          javascript: 'alert("coucou")',
          css: 'body { background-color: red; }'
        }
      },
      services: {
        twitter: {
          username: '@Kuja',
          whitelisted: true
        }
      },
      cache: {
        previews: {
          size: 2
        },
        captions: {
          size: 3
        }
      },
      signup: {
        enabled: false,
        limit: 5,
        requiresEmailVerification: false
      },
      admin: {
        email: 'superadmin1@example.com'
      },
      contactForm: {
        enabled: false
      },
      user: {
        videoQuota: 5242881,
        videoQuotaDaily: 318742
      },
      transcoding: {
        enabled: true,
        allowAdditionalExtensions: true,
        threads: 1,
        resolutions: {
          '240p': false,
          '360p': true,
          '480p': true,
          '720p': false,
          '1080p': false
        },
        hls: {
          enabled: false
        }
      },
      import: {
        videos: {
          http: {
            enabled: false
          },
          torrent: {
            enabled: false
          }
        }
      }
    }
    await updateCustomConfig(server.url, server.accessToken, newCustomConfig)

    const res = await getCustomConfig(server.url, server.accessToken)
    const data = res.body

    checkUpdatedConfig(data)
  })

  it('Should have the correct updated video allowed extensions', async function () {
    const res = await getConfig(server.url)
    const data: ServerConfig = res.body

    expect(data.video.file.extensions).to.have.length.above(3)
    expect(data.video.file.extensions).to.contain('.mp4')
    expect(data.video.file.extensions).to.contain('.webm')
    expect(data.video.file.extensions).to.contain('.ogv')
    expect(data.video.file.extensions).to.contain('.flv')
    expect(data.video.file.extensions).to.contain('.mkv')
  })

  it('Should have the configuration updated after a restart', async function () {
    this.timeout(10000)

    killallServers([ server ])

    await reRunServer(server)

    const res = await getCustomConfig(server.url, server.accessToken)
    const data = res.body

    checkUpdatedConfig(data)
  })

  it('Should fetch the about information', async function () {
    const res = await getAbout(server.url)
    const data: About = res.body

    expect(data.instance.name).to.equal('PeerTube updated')
    expect(data.instance.shortDescription).to.equal('my short description')
    expect(data.instance.description).to.equal('my super description')
    expect(data.instance.terms).to.equal('my super terms')
  })

  it('Should remove the custom configuration', async function () {
    this.timeout(10000)

    await deleteCustomConfig(server.url, server.accessToken)

    const res = await getCustomConfig(server.url, server.accessToken)
    const data = res.body

    checkInitialConfig(data)
  })

  after(async function () {
    killallServers([ server ])
  })
})

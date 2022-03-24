package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import io.mockk.Called
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.AfterClass
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class TokenProviderTest {

    companion object {
        const val TOKEN = "token"
        const val ERROR = "error"

        @BeforeClass
        @JvmStatic
        fun setup() {
            mockkObject(ReactExtensions)
            with(ReactExtensions) {
                every {
                    any<ReactApplicationContext>().sendEvent(any())
                } returns Unit
                every {
                    any<ReactApplicationContext>().sendEvent(any(), any())
                } returns Unit
            }
        }

        @AfterClass
        @JvmStatic
        fun teardown() {
            unmockkAll()
        }
    }

    private val context = mockk<ReactApplicationContext>()
    private val callback = mockk<ConnectionTokenCallback>(relaxed = true)

    @Test
    fun `should set connection token`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        verify(exactly = 1) { context.sendEvent(any()) }
        verify { callback wasNot Called }

        tokenProvider.setConnectionToken(TOKEN, ERROR)

        verify(exactly = 1) { callback.onSuccess(TOKEN) }
        verify(exactly = 0) { callback.onFailure(any()) }
    }

    @Test
    fun `should fail on connection token retrieval error`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        verify(exactly = 1) { context.sendEvent(any()) }
        verify { callback wasNot Called }

        tokenProvider.setConnectionToken(null, ERROR)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback.onFailure(any()) }

        tokenProvider.setConnectionToken(null, null)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 2) { callback.onFailure(any()) }
    }
}
